require_dependency pegasus_dir('forms/pd_workshop_survey')

module Api::V1::Pd::WorkshopScoreSummarizer
  FACILITATOR_EFFECTIVENESS_QUESTIONS = [
    :how_much_learned_s,
    :how_motivating_s,
    :how_clearly_presented_s,
    :how_interesting_s,
    :how_often_given_feedback_s,
    :how_comfortable_asking_questions_s,
    :how_often_taught_new_things_s
  ].freeze

  TEACHER_ENGAGEMENT_QUESTIONS = [
    :how_much_participated_s,
    :how_often_talk_about_ideas_outside_s,
    :how_often_lost_track_of_time_s,
    :how_excited_before_s,
    :overall_how_interested_s
  ].freeze

  OVERALL_SUCCESS_QUESTIONS = [
    :more_prepared_than_before_s,
    :know_where_to_go_for_help_s,
    :suitable_for_my_experience_s,
    :would_recommend_s,
    :part_of_community_s
  ].freeze

  INDIVIDUAL_RESPONSE_QUESTIONS = [
    :how_much_learned_s,
    :how_motivating_s,
    :how_clearly_presented_s,
    :how_interesting_s,
    :how_often_given_feedback_s,
    :how_comfortable_asking_questions_s,
    :how_often_taught_new_things_s,
    :how_much_participated_s,
    :how_often_talk_about_ideas_outside_s,
    :how_often_lost_track_of_time_s,
    :how_excited_before_s,
    :overall_how_interested_s,
    :more_prepared_than_before_s,
    :know_where_to_go_for_help_s,
    :suitable_for_my_experience_s,
    :would_recommend_s,
    :part_of_community_s
  ].freeze

  FREE_RESPONSE_QUESTIONS = [
    :things_facilitator_did_well_s,
    :things_facilitator_could_improve_s,
    :things_you_liked_s,
    :things_you_would_change_s,
    :anything_else_s
  ].freeze

  FACILITATOR_SPECIFIC_QUESTIONS = [
    :how_clearly_presented_s,
    :how_interesting_s,
    :how_often_given_feedback_s,
    :how_comfortable_asking_questions_s,
    :how_often_taught_new_things_s,
    :things_facilitator_did_well_s,
    :things_facilitator_could_improve_s
  ].freeze

  FACILITATOR_SPECIFIC_MULTIPLE_CHOICE_QUESTIONS = FACILITATOR_SPECIFIC_QUESTIONS - FREE_RESPONSE_QUESTIONS
  FACILITATOR_SPECIFIC_FREE_RESPONSE_QUESTIONS = FACILITATOR_SPECIFIC_QUESTIONS & FREE_RESPONSE_QUESTIONS

  def get_score_for_workshops(workshops, include_free_responses: false, facilitator_name_filter: nil)
    facilitators = workshops.flat_map(&:facilitators).map(&:name)
    response_summary = {}

    response_sums, facilitator_specific_response_sums, free_response_summary, facilitator_specific_free_response_sums = initialize_response_summaries(facilitators, facilitator_name_filter)

    responses = PEGASUS_DB[:forms].where(source_id: workshops.flat_map(&:enrollments).map(&:id), kind: 'PdWorkshopSurvey').map {|form| form[:data].nil? ? {} : JSON.parse(form[:data])}
    responses.compact!
    return {} if responses.count == 0

    responses_per_facilitator = calculate_facilitator_name_frequencies(responses)

    generate_survey_response_sums(responses, response_sums, facilitator_specific_response_sums, facilitator_name_filter)

    response_summary.merge! generate_response_averages(responses, response_sums, facilitator_specific_response_sums, responses_per_facilitator, facilitator_name_filter)

    if include_free_responses
      generate_free_response_sums(responses, free_response_summary, facilitator_specific_free_response_sums, responses_per_facilitator, facilitator_name_filter)
      response_summary.merge!(free_response_summary)
    end

    response_summary[:teacher_engagement] = (response_summary.values_at(*TEACHER_ENGAGEMENT_QUESTIONS).reduce(:+) / TEACHER_ENGAGEMENT_QUESTIONS.length.to_f).round(2)
    response_summary[:overall_success] = (response_summary.values_at(*OVERALL_SUCCESS_QUESTIONS).reduce(:+) / OVERALL_SUCCESS_QUESTIONS.length.to_f).round(2)

    # Compute aggregate scores
    response_summary[:facilitator_effectiveness] = (response_summary.values_at(*FACILITATOR_EFFECTIVENESS_QUESTIONS).reduce(:+) / FACILITATOR_EFFECTIVENESS_QUESTIONS.length.to_f).round(2)
    response_summary[:number_teachers] = workshops.flat_map(&:enrollments).count
    response_summary[:response_count] = responses.count

    response_summary
  end

  def calculate_facilitator_name_frequencies(responses)
    if responses.first['how_often_given_feedback_s'].is_a? Hash
      # the below two lines return a histogram showing FacilitatorName=># Responses.
      # Using 'how_often_given_feedback_s' for no particular reason - any of the facilitator
      # specific responses would do fine here
      facilitator_name_responses = responses.map {|x| x['how_often_given_feedback_s']}.flat_map(&:keys)
      return Hash[*facilitator_name_responses.group_by {|v| v}.flat_map {|k, v| [k, v.size]}]
    else
      nil
    end
  end

  def initialize_response_summaries(facilitators, facilitator_name_filter = nil)
    # Initalize a hash of non facilitator specific questions to answer sums
    response_sums = Hash[INDIVIDUAL_RESPONSE_QUESTIONS.map {|question| [question, 0]}]

    # Initialize a hash of facilitator specific questions to hashes of facilitator->answer sums.
    facilitator_specific_response_sums =
      if facilitator_name_filter
        Hash[FACILITATOR_SPECIFIC_MULTIPLE_CHOICE_QUESTIONS.map {|question| [question, {facilitator_name_filter => 0}]}]
      else
        Hash[FACILITATOR_SPECIFIC_MULTIPLE_CHOICE_QUESTIONS.map {|question| [question, Hash[facilitators.map {|facilitator| [facilitator, 0]}]]}]
      end

    free_response_summary = Hash[FREE_RESPONSE_QUESTIONS.map {|question| [question, []]}]

    # Initialize a hash of free response questions to hashes of facilitators->answers
    facilitator_specific_free_response_sums =
      if facilitator_name_filter
        Hash[FACILITATOR_SPECIFIC_FREE_RESPONSE_QUESTIONS.map {|question| [question, {facilitator_name_filter => []}]}]
      else
        Hash[FACILITATOR_SPECIFIC_FREE_RESPONSE_QUESTIONS.map {|question| [question, Hash[facilitators.map {|facilitator| [facilitator, []]}]]}]
      end

    return response_sums, facilitator_specific_response_sums, free_response_summary, facilitator_specific_free_response_sums
  end

  def generate_survey_response_sums(responses, response_sums, facilitator_specific_response_sums, facilitator_name_filter)
    responses.each do |response|
      response.symbolize_keys.each do |question, answer|
        if INDIVIDUAL_RESPONSE_QUESTIONS.include? question
          if answer.is_a? Hash
            if facilitator_name_filter
              next unless answer[facilitator_name_filter]
              facilitator_specific_response_sums[question][facilitator_name_filter] += get_score_for_response(question, answer[facilitator_name_filter])
            else
              answer.each do |facilitator_name, facilitator_answer|
                facilitator_specific_response_sums[question][facilitator_name] += get_score_for_response(question, facilitator_answer)
              end
            end
          else
            response_sums[question] += get_score_for_response(question, answer)
          end
        end
      end
    end
  end

  def generate_free_response_sums(responses, free_response_summary, facilitator_specific_free_response_sums, responses_per_facilitator, facilitator_name_filter = nil)
    responses.each do |response|
      response.symbolize_keys.each do |question, answer|
        if FREE_RESPONSE_QUESTIONS.include? question
          if answer.is_a? Hash
            if facilitator_name_filter
              next unless answer[facilitator_name_filter]
              facilitator_specific_free_response_sums[question][facilitator_name_filter].append answer[facilitator_name_filter]
            else
              answer.each do |facilitator_name, facilitator_answer|
                facilitator_specific_free_response_sums[question][facilitator_name].append facilitator_answer
              end
            end
          else
            free_response_summary[question].append answer
          end
        end
      end
    end

    if responses_per_facilitator
      free_response_summary.merge!(facilitator_specific_free_response_sums)
    end
  end

  def generate_response_averages(responses, response_sums, facilitator_specific_response_sums, responses_per_facilitator, facilitator_name_filter = nil)
    response_summary = {}

    # Note that this is not the number of responses. Some responses apply for multiple
    # facilitators. If a workshop has 5 responses, 4 may be for facilitator A, 3 may be
    # for facilitator B, we'd expect this to be 7.
    responses_for_all_facilitators_count =
      if responses_per_facilitator
        facilitator_name_filter ? responses_per_facilitator[facilitator_name_filter] : responses_per_facilitator.values.reduce(:+)
      else
        responses.count
      end.to_f

    response_sums.each do |question, answer_sum|
      response_summary[question] = (answer_sum / responses.count.to_f).round(2)
    end

    if responses_per_facilitator
      facilitator_specific_response_sums.each do |question, facilitator_answers|
        response_sum = facilitator_answers.values.reduce(:+) || 0
        response_summary[question] = (response_sum / responses_for_all_facilitators_count).round(2)
      end
    end

    response_summary
  end

  private

  def get_score_for_response(question, answer)
    if OVERALL_SUCCESS_QUESTIONS.include?(question)
      ::PdWorkshopSurvey::AGREE_SCALE_OPTIONS.index(answer) + 1
    else
      ::PdWorkshopSurvey::OPTIONS[question].index(answer) + 1
    end
  end
end
