class Api::V1::SchoolAutocomplete < AutocompleteHelper
  # Queries the schools lookup table for schools that match the user-defined
  # search criteria.
  # @param query [String] the user-define query string
  # @param limit [int] the maximum number of results to return
  # @return [Array] an array of JSON formatted schools
  def self.get_matches(query, limit, use_new_search)
    limit = format_limit(limit)

    rows = School.limit(limit)
    if use_new_search
      terms = get_query_terms query
      match_terms = []
      terms.each do |term|
        # This SQL string is not at risk for injection vulnerabilites because
        # it's being sanitized by activerecord, so it's safe to wrap in
        # Arel.sql
        match_terms.push ActiveRecord::Base.sanitize_sql_for_order([Arel.sql("CASE when (MATCH(name, city) AGAINST(? IN BOOLEAN MODE) OR zip = ?) THEN 1 ELSE 0 END"), term, term])
      end
      matches = match_terms.join ' + '
      rows = rows.
        where("MATCH(name, city) AGAINST(? IN BOOLEAN MODE)", terms.join(' ')).
        # This SQL string is not at risk for injection vulnerabilites because
        # matches contains exclusively strings which have been sanitized by
        # activerecord, so it's safe to wrap in Arel.sql
        order(Arel.sql("(#{matches}) DESC, state, city, name"))
    elsif search_by_zip?((query = query.strip))
      query = "#{query[0, 5]}%"
      rows = rows.where("zip LIKE ?", query)
    else
      query = format_query(query)
      return [] if query.length < MIN_WORD_LENGTH + 2
      rows = rows.
        where("MATCH(name,city) AGAINST(? IN BOOLEAN MODE)", query).
        # This SQL string is not at risk for injection vulnerabilites because
        # it's being sanitized by activerecord, so it's safe to wrap in
        # Arel.sql
        order(ActiveRecord::Base.sanitize_sql_for_order([Arel.sql("MATCH(name,city) AGAINST(? IN BOOLEAN MODE) DESC, state, city, name"), query]))
    end

    return rows.map do |row|
      Serializer.new(row).attributes
    end
  end

  # Determines if we should perform a search by ZIP code rather than by school
  # name or city.
  # @param query [String] the user-define query string
  # @return [boolean] true if it might be a ZIP, false otherwise
  def self.search_by_zip?(query)
    return !!(query =~ /^(\d{,5}|(\d{5}-\d{,4}))$/)
  end

  # JSON serializer used by get_matches.
  class Serializer < ActiveModel::Serializer
    attributes :nces_id, :name, :city, :state, :zip, :school_type, :latitude, :longitude

    def nces_id
      object.id.to_s
    end

    def name
      object.name.titleize
    end

    def city
      object.city.titleize
    end
  end
end
