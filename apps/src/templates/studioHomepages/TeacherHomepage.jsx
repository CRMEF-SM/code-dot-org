import React, {PropTypes, Component} from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import HeaderBanner from '../HeaderBanner';
import Notification from '../Notification';
import RecentCourses from './RecentCourses';
import TeacherSections from './TeacherSections';
import StudentSections from './StudentSections';
import TeacherResources from './TeacherResources';
import ProjectWidgetWithData from '@cdo/apps/templates/projects/ProjectWidgetWithData';
import shapes from './shapes';
import ProtectedStatefulDiv from '../ProtectedStatefulDiv';
import i18n from "@cdo/locale";
import {pegasus} from '@cdo/apps/lib/util/urlHelpers';
import CensusTeacherBanner from '../census2017/CensusTeacherBanner';

const styles = {
  clear: {
    clear: 'both',
    height: 30
  }
};

export default class TeacherHomepage extends Component {
  static propTypes = {
    joinedSections: shapes.sections,
    courses: shapes.courses,
    topCourse: shapes.topCourse,
    announcements: PropTypes.array.isRequired,
    isRtl: PropTypes.bool.isRequired,
    queryStringOpen: PropTypes.string,
    canViewAdvancedTools: PropTypes.bool,
    hocLaunch: PropTypes.object,
    isEnglish: PropTypes.bool.isRequired,
    showCensusBanner: PropTypes.bool.isRequired,
    ncesSchoolId: PropTypes.string,
    censusQuestion: PropTypes.oneOf(['how_many_10_hours', 'how_many_20_hours']),
    teacherName: PropTypes.string,
    teacherId: PropTypes.number,
    teacherEmail: PropTypes.string,
    schoolYear: PropTypes.number,
    isEnglish: PropTypes.bool.isRequired
  };

  state = {
    showCensusBanner: this.props.showCensusBanner,
  };

  bindCensusBanner = (banner) => {
    this.censusBanner = banner;
  }

  handleCensusBannerTeachesChange(event) {
    this.setState({censusBannerTeachesSelection: (event.target.id==="teachesYes")});
  }

  handleCensusBannerInClassChange(event) {
    this.setState({censusBannerInClassSelection: (event.target.id==="inClass")});
  }

  handleCensusBannerSubmit() {
    if (this.censusBanner.isValid()) {
      $.ajax({
        url: "/dashboardapi/v1/census/CensusTeacherBannerV1",
        type: "post",
        dataType: "json",
        data: this.censusBanner.getData(),
      }).done(this.handleCensusSubmitSuccess).fail(this.handleCensusSubmitError);
    } else {
      this.setState({showCensusInvalidError: true});
    }
  }

  handleCensusSubmitSuccess = () => {
    this.setState({censusSubmittedSuccessfully: true});
  }

  handleCensusSubmitError = () => {
    this.setState({
      showCensusUnknownError: true,
    });
  }

  hideCensusBanner= () =>  {
    this.setState({
      showCensusBanner: false,
    });
  }

  dismissCensusBanner() {
    $.ajax({
      url: `/api/v1/users/${this.props.teacherId}/dismiss_census_banner`,
      type: "post",
    }).done(this.hideCensusBanner).fail(this.handleDismissCensusBannerError);
  }

  handleDismissCensusBannerError = (xhr) => {
    console.error(`Failed to dismiss census banner! ${xhr.responseText}`);
    this.hideCensusBanner();
  }

  postponeCensusBanner() {
    $.ajax({
      url: `/api/v1/users/${this.props.teacherId}/postpone_census_banner`,
      type: "post",
    }).done(this.hideCensusBanner).fail(this.handlePostponeCensusBannerError);
  }

  handlePostponeCensusBannerError = (xhr) => {
    console.error(`Failed to postpone census banner! ${xhr.responseText}`);
    this.hideCensusBanner();
  }

  componentDidMount() {
    // The component used here is implemented in legacy HAML/CSS rather than React.
    $('#terms_reminder').appendTo(ReactDOM.findDOMNode(this.refs.termsReminder)).show();
    $('#flashes').appendTo(ReactDOM.findDOMNode(this.refs.flashes)).show();
  }

  render() {
    const { courses, topCourse, announcements, isRtl, queryStringOpen, joinedSections } = this.props;
    const { canViewAdvancedTools, hocLaunch, isEnglish } = this.props;
    const { ncesSchoolId, censusQuestion, schoolYear } = this.props;
    const { teacherId, teacherName, teacherEmail } = this.props;
    const { canViewAdvancedTools } = this.props;

    return (
      <div>
        <HeaderBanner
          headingText={i18n.homepageHeading()}
          short={true}
        />
        <ProtectedStatefulDiv
          ref="flashes"
        />
        <ProtectedStatefulDiv
          ref="termsReminder"
        />

        {announcements.length > 0 && (
          <div>
            <Notification
              type={announcements[0].type || "bullhorn"}
              notice={announcements[0].heading}
              details={announcements[0].description}
              dismissible={false}
              buttonText={announcements[0].buttonText}
              buttonLink={announcements[0].link}
              newWindow={true}
              analyticId={announcements[0].id}
            />
            <div style={styles.clear}/>
          </div>
        )}
        {this.state.showCensusBanner && (
           <div>
             <CensusTeacherBanner
               ref={this.bindCensusBanner}
               schoolYear={schoolYear}
               ncesSchoolId={ncesSchoolId}
               question={censusQuestion}
               teaches={this.state.censusBannerTeachesSelection}
               inClass={this.state.censusBannerInClassSelection}
               teacherId={teacherId}
               teacherName={teacherName}
               teacherEmail={teacherEmail}
               showInvalidError={this.state.showCensusInvalidError}
               showUnknownError={this.state.showCensusUnknownError}
               submittedSuccessfully={this.state.censusSubmittedSuccessfully}
               onSubmit={() => this.handleCensusBannerSubmit()}
               onDismiss={() => this.dismissCensusBanner()}
               onPostpone={() => this.postponeCensusBanner()}
               onTeachesChange={(event) => this.handleCensusBannerTeachesChange(event)}
               onInClassChange={(event) => this.handleCensusBannerInClassChange(event)}
             />
             <br/>
           </div>
        )}
        <TeacherSections
          isRtl={isRtl}
          queryStringOpen={queryStringOpen}
        />
        <RecentCourses
          courses={courses}
          topCourse={topCourse}
          showAllCoursesLink={true}
          isTeacher={true}
          isRtl={isRtl}
        />
        <TeacherResources isRtl={isRtl}/>
        <ProjectWidgetWithData
          isRtl={isRtl}
          canViewFullList={true}
          canViewAdvancedTools={canViewAdvancedTools}
        />
        <StudentSections
          initialSections={joinedSections}
          canLeave={true}
          isRtl={isRtl}
          isTeacher={true}
        />
      </div>
    );
  }
}
