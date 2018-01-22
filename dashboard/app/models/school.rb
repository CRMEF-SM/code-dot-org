# == Schema Information
#
# Table name: schools
#
#  id                 :string(12)       not null, primary key
#  school_district_id :integer
#  name               :string(255)      not null
#  city               :string(255)      not null
#  state              :string(255)      not null
#  zip                :string(255)      not null
#  school_type        :string(255)      not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  address_line1      :string(50)
#  address_line2      :string(30)
#  address_line3      :string(30)
#  latitude           :decimal(8, 6)
#  longitude          :decimal(9, 6)
#  state_school_id    :string(255)
#
# Indexes
#
#  index_schools_on_id                  (id) UNIQUE
#  index_schools_on_name_and_city       (name,city)
#  index_schools_on_school_district_id  (school_district_id)
#  index_schools_on_state_school_id     (state_school_id) UNIQUE
#  index_schools_on_zip                 (zip)
#

class School < ActiveRecord::Base
  include Seeded

  self.primary_key = 'id'

  belongs_to :school_district

  has_many :school_stats_by_year

  validates :state_school_id, allow_blank: true, format: {with: /\A[A-Z]{2}-.+-.+\z/, message: "must be {State Code}-{State District Id}-{State School Id}"}

  # Gets the full address of the school.
  # @return [String] The full address.
  def full_address
    %w(address_line1 address_line2 address_line3 city state zip).map do |col|
      attributes[col].presence
    end.compact.join(' ')
  end

  # Determines if this is a high-needs school.
  # @return [Boolean] True if high-needs, false otherwise.
  def high_needs?
    stats = school_stats_by_year.order(school_year: :desc).first
    if stats.nil? || stats.frl_eligible_total.nil? || stats.students_total.nil?
      return false
    end
    stats.frl_eligible_total.to_f / stats.students_total.to_f > 0.5
  end

  # Public school ids from NCES are always 12 digits, possibly with
  # leading zeros. In the DB, those leading zeros have been stripped out.
  # Other school types are less than 12 characters and in the DB they
  # have not had their leading zeros removed.
  def self.normalize_school_id(raw_school_id)
    raw_school_id.length == 12 ? raw_school_id.to_i.to_s : raw_school_id
  end

  # Use the zero byte as the quote character to allow importing double quotes
  #   via http://stackoverflow.com/questions/8073920/importing-csv-quoting-error-is-driving-me-nuts
  CSV_IMPORT_OPTIONS = {col_sep: "\t", headers: true, quote_char: "\x00"}.freeze

  # Gets the seeding file name.
  # @param stub_school_data [Boolean] True for stub file.
  def self.get_seed_filename(stub_school_data)
    stub_school_data ? 'test/fixtures/schools.tsv' : 'config/schools.tsv'
  end

  def self.construct_state_school_id(state_code, district_id, school_id)
    "#{state_code}-#{district_id}-#{school_id}"
  end

  # Seeds all the data from the source file.
  # @param options [Hash] Optional map of options.
  def self.seed_all(options = {})
    options[:stub_school_data] ||= CDO.stub_school_data
    options[:force] ||= false

    # use a much smaller dataset in environments that reseed data frequently.
    schools_tsv = get_seed_filename(options[:stub_school_data])
    expected_count = `wc -l #{schools_tsv}`.to_i - 1
    raise "#{schools_tsv} contains no data" unless expected_count > 0

    # It takes approximately 4 minutes to seed config/schools.tsv.
    # Skip seeding if the data is already present. Note that this logic will
    # not re-seed data if the number of records in the DB is greater than or
    # equal to that in the TSV file, even if the data is different.
    if options[:force] || School.count < expected_count
      CDO.log.debug "seeding schools (#{expected_count} rows)"
      School.transaction do
        merge_from_csv(schools_tsv)
      end
    end
  end

  def self.seed_from_s3
    # NCES school data has been built up in the DB over time by pulling in different
    # data files. This seeding recreates the order in which they we incorporated.
    # NOTE: we are intentionally not populating the state_school_id based on the
    # 2014-2015 preliminary or 2013-2014 public/charter data sets. Those files
    # containt duplicate entries where some schools appear to be listed more than
    # once but with different NCES ids. Since state_school_id needs to be unique
    # the seeding would fail if we tried to set the state ids from those files.
    # The 2014-2015 public/charter data does not have this issue so we do load the
    # state_school_ids from there.
    School.transaction do
      CDO.log.info "Seeding 2014-2015 PRELIMINARY public and charter school data."
      # Originally from https://nces.ed.gov/ccd/Data/zip/Sch14pre_txt.zip
      AWS::S3.seed_from_file('cdo-nces', "2014-2015/ccd/Sch14pre.txt") do |filename|
        merge_from_csv(filename, {col_sep: "\t", headers: true, quote_char: "\x00", encoding: 'ISO-8859-1:UTF-8'}) do |row|
          {
            id:                 row['NCESSCH'].to_i.to_s,
            name:               row['SCHNAM'].upcase,
            address_line1:      row['LSTREE'].to_s.upcase.presence,
            address_line2:      nil,
            address_line3:      nil,
            city:               row['LCITY'].to_s.upcase.presence,
            state:              row['LSTATE'].to_s.upcase.presence,
            zip:                row['LZIP'],
            latitude:           nil,
            longitude:          nil,
            school_type:        row['CHARTR'] == '1' ? 'charter' : 'public',
            school_district_id: row['LEAID'].to_i,
          }
        end
      end

      CDO.log.info "Seeding 2013-2014 public and charter school data."
      # Originally from https://nces.ed.gov/ccd/Data/zip/sc132a_txt.zip
      AWS::S3.seed_from_file('cdo-nces', "2013-2014/ccd/sc132a.txt") do |filename|
        merge_from_csv(filename) do |row|
          {
            id:                 row['NCESSCH'].to_i.to_s,
            name:               row['SCHNAM'].upcase,
            address_line1:      row['LSTREE'].to_s.upcase.presence,
            address_line2:      nil,
            address_line3:      nil,
            city:               row['LCITY'].to_s.upcase.presence,
            state:              row['LSTATE'].to_s.upcase.presence,
            zip:                row['LZIP'],
            latitude:           nil,
            longitude:          nil,
            school_type:        row['CHARTR'] == '1' ? 'charter' : 'public',
            school_district_id: row['LEAID'].to_i,
          }
        end
      end

      CDO.log.info "Seeding 2013-2014 private school data."
      # Originally from https://nces.ed.gov/surveys/pss/zip/pss1314_pu_csv.zip
      AWS::S3.seed_from_file('cdo-nces', "2013-2014/pss/pss1314_pu.csv") do |filename|
        merge_from_csv(filename, {headers: true, encoding: 'ISO-8859-1:UTF-8'}) do |row|
          {
            id:                 row['PPIN'],
            name:               row['PINST'].upcase,
            address_line1:      row[row['PL_ADD'].nil? ? 'PADDRS' : 'PL_ADD'].to_s.upcase.presence,
            address_line2:      nil,
            address_line3:      nil,
            city:               row[row['PL_CIT'].nil? ? 'PCITY' : 'PL_CIT'].to_s.upcase.presence,
            state:              row[row['PL_STABB'].nil? ? 'PSTABB' : 'PL_STABB'].to_s.upcase.presence,
            zip:                row[row['PL_ZIP'].nil? ? 'PZIP' : 'PL_ZIP'],
            latitude:           row['LATITUDE14'].to_f,
            longitude:          row['LONGITUDE14'].to_f,
            school_type:        'private',
            school_district_id: nil,
            state_school_id:    nil,
          }
        end
      end

      CDO.log.info "Seeding 2014-2015 public and charter school data."
      # Originally from https://nces.ed.gov/ccd/Data/zip/ccd_sch_029_1415_w_0216601a_txt.zip
      AWS::S3.seed_from_file('cdo-nces', "2014-2015/ccd/ccd_sch_029_1415_w_0216601a.txt") do |filename|
        merge_from_csv(filename) do |row|
          {
            id:                 row['NCESSCH'].to_i.to_s,
            name:               row['SCH_NAME'].upcase,
            address_line1:      row['LSTREET1'].to_s.upcase.presence,
            address_line2:      row['LSTREET2'].to_s.upcase.presence,
            address_line3:      row['LSTREET3'].to_s.upcase.presence,
            city:               row['LCITY'].to_s.upcase.presence,
            state:              row['LSTATE'].to_s.upcase.presence,
            zip:                row['LZIP'],
            latitude:           nil,
            longitude:          nil,
            school_type:        row['CHARTER_TEXT'][0, 1] == 'Y' ? 'charter' : 'public',
            school_district_id: row['LEAID'].to_i,
            state_school_id:    construct_state_school_id(row['LSTATE'].to_s.upcase, row['ST_LEAID'], row['ST_SCHID']),
          }
        end
      end

      CDO.log.info "Seeding 2014-2015 public school geographic data."
      # Originally from https://nces.ed.gov/ccd/Data/zip/EDGE_GEOIDS_201415_PUBLIC_SCHOOL_csv.zip
      AWS::S3.seed_from_file('cdo-nces', "2014-2015/ccd/EDGE_GEOIDS_201415_PUBLIC_SCHOOL.csv") do |filename|
        merge_from_csv(filename, {headers: true, encoding: 'ISO-8859-1:UTF-8'}) do |row|
          {
            id:                 row['NCESSCH'].to_i.to_s,
            latitude:           row['LATCODE'].to_f,
            longitude:          row['LONGCODE'].to_f
          }
        end
      end

      CDO.log.info "Seeding 2015-2016 private school data."
      # Originally from https://nces.ed.gov/surveys/pss/zip/pss1516_pu_csv.zip
      AWS::S3.seed_from_file('cdo-nces', "2015-2016/pss/pss1516_pu.csv") do |filename|
        merge_from_csv(filename, {headers: true, encoding: 'ISO-8859-1:UTF-8'}) do |row|
          {
            id:                 row['ppin'],
            name:               row['pinst'].upcase,
            address_line1:      row[row['pl_add'].nil? ? 'paddrs' : 'pl_add'].to_s.upcase.presence,
            address_line2:      nil,
            address_line3:      nil,
            city:               row[row['pl_cit'].nil? ? 'pcity' : 'pl_cit'].to_s.upcase.presence,
            state:              row[row['pl_stabb'].nil? ? 'pstabb' : 'pl_stabb'].to_s.upcase.presence,
            zip:                row[row['pl_zip'].nil? ? 'pzip' : 'pl_zip'],
            latitude:           row['latitude16'].to_f,
            longitude:          row['longitude16'].to_f,
            school_type:        'private',
            school_district_id: nil,
            state_school_id:    nil,
          }
        end
      end
    end
  end

  # Loads/merges the data from a CSV into the schools table.
  # Requires a block to parse the row.
  # @param filename [String] The CSV file name.
  # @param options [Hash] The CSV file parsing options.
  def self.merge_from_csv(filename, options = CSV_IMPORT_OPTIONS)
    CSV.read(filename, options).each do |row|
      parsed = block_given? ? yield(row) : row.to_hash.symbolize_keys
      loaded = find_by_id(parsed[:id])
      if loaded.nil?
        School.new(parsed).save!
      else
        loaded.assign_attributes(parsed)
        loaded.update!(parsed) if loaded.changed?
      end
    end
  end

  # Download the data in the table to a CSV file.
  # @param filename [String] The CSV file name.
  # @param options [Hash] The CSV file parsing options.
  # @return [String] The CSV file name.
  def self.write_to_csv(filename, options = CSV_IMPORT_OPTIONS)
    cols = %w(id name address_line1 address_line2 address_line3 city state zip latitude longitude school_type school_district_id)
    CSV.open(filename, 'w', options) do |csv|
      csv << cols
      rows = block_given? ? yield : order(:id)
      rows.map do |row|
        csv << cols.map {|col| row[col]}
      end
    end
    return filename
  end
end
