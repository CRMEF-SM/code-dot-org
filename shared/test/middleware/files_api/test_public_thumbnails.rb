require_relative '../../files_api_test_base' # Must be required first to establish load paths
require_relative '../../files_api_test_helper'
require 'cdo/aws/s3'

class PublicThumbnailsTest < FilesApiTestBase
  def setup
    @thumbnail_filename = '.metadata/thumbnail.png'
    @thumbnail_body = 'stub-thumbnail-body'
    AWS::S3.create_client
    Aws::S3::Client.expects(:new).never
  end

  def test_adult_thumbnail
    ImageModeration.stubs(:rate_image).once.returns :adult

    with_project_type('applab') do |channel_id|
      get "/v3/files-public/#{channel_id}/#{@thumbnail_filename}"

      # Responds with a 404, like we do for flagged content
      assert not_found?

      # Includes content rating metadata in the response that the client can read
      assert_equal 'adult', last_response['x-cdo-content-rating']

      # Response is cached for an hour
      assert_equal 'public, max-age=3600, s-maxage=1800', last_response['Cache-Control']

      # Flags the project as abusive.
      get "/v3/channels/#{channel_id}/abuse"
      assert successful?
      assert_equal 15, JSON.parse(last_response.body)['abuse_score']

      # Flags the thumbnail as abusive
      thumbnail = FileBucket.new.get(channel_id, @thumbnail_filename)
      metadata = thumbnail[:metadata]
      thumbnail_abuse = [metadata['abuse_score'].to_i, metadata['abuse-score'].to_i].max
      assert_equal 15, thumbnail_abuse
    end
  end

  def test_racy_thumbnail
    ImageModeration.stubs(:rate_image).once.returns :racy

    with_project_type('applab') do |channel_id|
      get "/v3/files-public/#{channel_id}/#{@thumbnail_filename}"

      # Responds with a 404, like we do for flagged content
      assert not_found?

      # Includes content rating metadata in the response that the client can read
      assert_equal 'racy', last_response['x-cdo-content-rating']

      # Response is cached for an hour
      assert_equal 'public, max-age=3600, s-maxage=1800', last_response['Cache-Control']

      # Flags the project as abusive.
      get "/v3/channels/#{channel_id}/abuse"
      assert successful?
      assert_equal 15, JSON.parse(last_response.body)['abuse_score']

      # Flags the thumbnail as abusive
      thumbnail = FileBucket.new.get(channel_id, @thumbnail_filename)
      metadata = thumbnail[:metadata]
      thumbnail_abuse = [metadata['abuse_score'].to_i, metadata['abuse-score'].to_i].max
      assert_equal 15, thumbnail_abuse
    end
  end

  def test_everyone_thumbnail
    ImageModeration.stubs(:rate_image).once.returns :everyone

    with_project_type('applab') do |channel_id|
      get "/v3/files-public/#{channel_id}/#{@thumbnail_filename}"
      assert successful?
      assert_equal 'public, max-age=3600, s-maxage=1800', last_response['Cache-Control']
      assert_equal @thumbnail_body, last_response.body

      # Does not flag the project as abusive
      get "/v3/channels/#{channel_id}/abuse"
      assert successful?
      assert_equal 0, JSON.parse(last_response.body)['abuse_score']

      # Does not flag the thumbnail as abusive
      thumbnail = FileBucket.new.get(channel_id, @thumbnail_filename)
      metadata = thumbnail[:metadata]
      thumbnail_abuse = [metadata['abuse_score'].to_i, metadata['abuse-score'].to_i].max
      assert_equal 0, thumbnail_abuse
    end
  end

  def test_bad_channel_thumbnail
    ImageModeration.expects(:rate_image).never.returns :everyone

    get "/v3/files-public/undefined/.metadata/thumbnail.png"
    assert not_found?
  end

  def test_moderates_applab
    assert_moderates_project_type 'applab'
  end

  def test_moderates_gamelab
    assert_moderates_project_type 'gamelab'
  end

  def test_no_moderation_for_artist
    skip 'Not implemented yet'
    refute_moderates_project_type 'artist'
  end

  def test_no_moderation_for_weblab
    skip 'Not implemented yet'
    refute_moderates_project_type 'weblab'
  end

  def test_no_moderation_for_frozen
    skip 'Not implemented yet'
    refute_moderates_project_type 'frozen'
  end

  def test_no_moderation_for_playlab
    skip 'Not implemented yet'
    refute_moderates_project_type 'playlab'
  end

  def test_no_moderation_for_flappy
    skip 'Not implemented yet'
    refute_moderates_project_type 'flappy'
  end

  def test_no_moderation_for_gumball
    skip 'Not implemented yet'
    refute_moderates_project_type 'gumball'
  end

  def test_no_moderation_for_iceage
    skip 'Not implemented yet'
    refute_moderates_project_type 'iceage'
  end

  def test_no_moderation_for_infinity
    skip 'Not implemented yet'
    refute_moderates_project_type 'infinity'
  end

  def test_no_moderation_for_minecraft_adventurer
    skip 'Not implemented yet'
    refute_moderates_project_type 'minecraft_adventurer'
  end

  def test_no_moderation_for_minecraft_designer
    skip 'Not implemented yet'
    refute_moderates_project_type 'minecraft_designer'
  end

  def test_no_moderation_for_minecraft_hero
    skip 'Not implemented yet'
    refute_moderates_project_type 'minecraft_hero'
  end

  def test_no_moderation_for_starwars
    skip 'Not implemented yet'
    refute_moderates_project_type 'starwars'
  end

  def test_no_moderation_for_starwarsblocks
    skip 'Not implemented yet'
    refute_moderates_project_type 'starwarsblocks'
  end

  def test_no_moderation_for_starwarsblocks_hour
    skip 'Not implemented yet'
    refute_moderates_project_type 'starwarsblocks_hour'
  end

  def test_no_moderation_for_bounce
    skip 'Not implemented yet'
    refute_moderates_project_type 'bounce'
  end

  def test_no_moderation_for_sports
    skip 'Not implemented yet'
    refute_moderates_project_type 'sports'
  end

  def test_no_moderation_for_basketball
    skip 'Not implemented yet'
    refute_moderates_project_type 'basketball'
  end

  def test_no_moderation_for_artist_k1
    skip 'Not implemented yet'
    refute_moderates_project_type 'artist_k1'
  end

  def test_no_moderation_for_playlab_k1
    skip 'Not implemented yet'
    refute_moderates_project_type 'playlab_k1'
  end

  private

  def assert_moderates_project_type(project_type)
    ImageModeration.expects(:rate_image).once.returns :everyone
    with_project_type project_type do |channel_id|
      get "/v3/files-public/#{channel_id}/#{@thumbnail_filename}"
      assert successful?
    end
  end

  def refute_moderates_project_type(project_type)
    ImageModeration.expects(:rate_image).never.returns :everyone
    with_project_type project_type do |channel_id|
      get "/v3/files-public/#{channel_id}/#{@thumbnail_filename}"
      assert successful?
    end
  end

  # Creates a channel of the given type, with a thumbnail populated.
  # Yields the channel id to the provided block.
  # Performs cleanup of the thumbnail and channel when the block ends.
  def with_project_type(project_type)
    # Setup
    channel_id = create_channel(projectType: project_type)
    create_thumbnail(channel_id)

    # Test
    yield channel_id

  ensure
    delete_thumbnail(channel_id)

    # Require that tests delete the assets they upload
    get "v3/files/#{channel_id}"
    expected_empty_files = {
      'files' => [],
      'filesVersionId' => ''
    }
    assert_equal(expected_empty_files, JSON.parse(last_response.body))

    delete_channel(channel_id)
  end

  def create_thumbnail(channel_id)
    put "/v3/files/#{channel_id}/#{@thumbnail_filename}", @thumbnail_body, {}
    assert successful?
  end

  def delete_thumbnail(channel_id)
    delete "/v3/files/#{channel_id}/#{@thumbnail_filename}"
    assert successful?
  end
end
