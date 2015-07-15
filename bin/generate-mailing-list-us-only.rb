#!/usr/bin/env ruby
require_relative '../pegasus/src/env'
require 'cdo/solr'
require src_dir 'database'

# Generates a list of teachers based on these filters:
# Petition parents, software engineers, none of the above - US ONLY
# Volunteer engineer list - US ONLY
# HocSignup2014- US ONLY
# CSEdWeekEvent2013- US ONLY

UNSUBSCRIBERS = {}.tap do |results|
  DB[:contacts].where('unsubscribed_at IS NOT NULL').each do |i|
    email = i[:email].downcase.strip
    results[email] = true
  end
end
puts "#{UNSUBSCRIBERS.count} unsubscribers loaded."


TEACHERS = {}.tap do |results|
  (
  query_contacts(q:'kind_s:"Petition" && create_ip_country_s:"United States"', fq:'-role_s:"student" && -role_s:"educator" && -role_s:"district_admin" && -role_s:"principal" && -role_s:"superintendent" && -role_s:"teacher"') +
      query_contacts(q:'kind_s:"VolunteerEngineerSubmission" && create_ip_country_s:"United States"') +
      query_contacts(q:'kind_s:"HocSignup2014" && create_ip_country_s:"United States"') +
      query_contacts(q:'kind_s:"CSEdWeekEvent2013" && create_ip_country_s:"United States"')
  ).each do |i|
    email = i[:email].downcase.strip
    results[email] = i unless UNSUBSCRIBERS[email]
  end
end
puts "#{TEACHERS.count} teachers loaded."

export_contacts_to_csv TEACHERS, "us-teachers.csv"
