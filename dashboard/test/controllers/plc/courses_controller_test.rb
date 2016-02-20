require 'test_helper'

class Plc::CoursesControllerTest < ActionController::TestCase
  setup do
    @course = create(:plc_course)
    @user = create :admin
    sign_in(@user)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:courses)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create plc_course" do
    assert_difference('Plc::Course.count') do
      post :create, plc_course: { plc_course: @course }
    end

    assert_redirected_to plc_course_path(assigns(:course))
  end

  test "should show plc_course" do
    get :show, id: @course
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @course
    assert_response :success
  end

  test "should update plc_course" do
    patch :update, id: @course, plc_course: {  plc_course: @course}
    assert_redirected_to plc_course_path(assigns(:course))
  end

  test "should destroy plc_course" do
    assert_difference('Plc::Course.count', -1) do
      delete :destroy, id: @course
    end

    assert_redirected_to plc_courses_path
  end
end
