class Api::V1::UserSchoolInfosController < ApplicationController
  before_action :authenticate_user!
  load_and_authorize_resource only: :update_last_confirmation_date

  # PATCH /api/v1/users_school_infos/<id>/update_last_confirmation_date
  def update_last_confirmation_date
    @user_school_info.update!(last_confirmation_date: DateTime.now)

    head :no_content
  end

  # PATCH /api/v1/users_school_infos
  def update
    return unless school_info_params[:school_id].present? || school_info_params[:country].present?

    new_school_info_params =
      if school_info_params[:full_address]&.blank?
        school_info_params.except(:full_address)
      else
        school_info_params
      end

    if new_school_info_params[:country]&.downcase&.eql? 'united states'
      new_school_info_params[:country] = 'US'
    end

    existing_school_info = current_user.last_complete_school_info
    existing_school_info&.assign_attributes school_info_params
    if existing_school_info.nil? || existing_school_info.changed?
      submitted_school_info = SchoolInfo.where(school_info_params).
        first_or_create(validation_type: SchoolInfo::VALIDATION_NONE)
      current_user.update! school_info: submitted_school_info
      current_user.user_school_infos.where(school_info: submitted_school_info).
        update(last_confirmation_date: DateTime.now)
    else
      current_user.user_school_infos.where(school_info: existing_school_info).
        update(last_confirmation_date: DateTime.now)
    end
  end

  private

  def school_info_params
    params.require(:user).require(:school_info_attributes).permit(:school_type, :school_name, :full_address, :country, :school_id)
  end
end
