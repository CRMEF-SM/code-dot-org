#
# Utility methods that help middleware access dashboard authentication and
# permissions information.
#

# @returns [Integer] the user_id associated with the current request
def current_user_id
  @request.user_id
end

# @returns [User] the dashboard user associated with the current request.
def current_user
  @dashboard_user ||= DASHBOARD_DB[:users][id: current_user_id]
end

# @returns [Boolean] true if the current user is an admin.
def is_admin?
  !!current_user[:admin]
end

# @param [Integer] section_id
# @returns [Boolean] true iff the current user is the owner of the given section.
#          Note: NOT always true for admins.
def owns_section?(section_id)
  return false unless section_id and current_user_id
  DASHBOARD_DB[:sections].where(id: section_id, user_id: current_user_id).any?
end
