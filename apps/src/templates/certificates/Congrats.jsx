import PropTypes from 'prop-types';
import React from 'react';
import Certificate from './Certificate';
import StudentsBeyondHoc from './StudentsBeyondHoc';
import TeachersBeyondHoc from './TeachersBeyondHoc';
import PetitionCallToAction from '@cdo/apps/templates/certificates/petition/PetitionCallToAction';
import styleConstants from '../../styleConstants';
import color from '@cdo/apps/util/color';

export default function Congrats(props) {
  /**
   * @param tutorial The specific tutorial the student completed i.e. 'dance', 'dance-2019', etc
   * @returns {string} The category type the specific tutorial belongs to i.e. 'dance', 'applab', etc
   */
  const getTutorialType = tutorial =>
    ({
      dance: 'dance',
      'dance-2019': 'dance',
      'applab-intro': 'applab',
      aquatic: '2018Minecraft',
      hero: '2017Minecraft',
      minecraft: 'pre2017Minecraft',
      mc: 'pre2017Minecraft',
      oceans: 'oceans'
    }[tutorial] || 'other');

  const {
    tutorial,
    certificateId,
    MCShareLink,
    userType,
    under13,
    language,
    randomDonorTwitter,
    randomDonorName,
    hideDancePartyFollowUp,
    showStudioCertificate
  } = props;
  const isEnglish = language === 'en';
  const tutorialType = getTutorialType(tutorial);

  return (
    <div style={styles.container}>
      <Certificate
        tutorial={tutorial}
        certificateId={certificateId}
        randomDonorTwitter={randomDonorTwitter}
        randomDonorName={randomDonorName}
        under13={under13}
        showStudioCertificate={showStudioCertificate}
      />
      {userType === 'teacher' && isEnglish && <TeachersBeyondHoc />}
      <StudentsBeyondHoc
        completedTutorialType={tutorialType}
        MCShareLink={MCShareLink}
        userType={userType}
        under13={under13}
        isEnglish={isEnglish}
        hideDancePartyFollowUp={hideDancePartyFollowUp}
      />
      {userType === 'signedOut' && isEnglish && <TeachersBeyondHoc />}
      <hr style={styles.divider} />
      <PetitionCallToAction />
    </div>
  );
}

Congrats.propTypes = {
  certificateId: PropTypes.string,
  tutorial: PropTypes.string,
  MCShareLink: PropTypes.string,
  userType: PropTypes.oneOf(['signedOut', 'teacher', 'student']).isRequired,
  under13: PropTypes.bool,
  language: PropTypes.string.isRequired,
  randomDonorTwitter: PropTypes.string,
  randomDonorName: PropTypes.string,
  hideDancePartyFollowUp: PropTypes.bool,
  showStudioCertificate: PropTypes.bool
};

const styles = {
  container: {
    width: '100%',
    maxWidth: styleConstants['content-width'],
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  divider: {
    borderColor: color.lightest_gray,
    borderWidth: '1px 0 0 0',
    borderStyle: 'solid',
    margin: '20px 0px 20px 0px'
  }
};
