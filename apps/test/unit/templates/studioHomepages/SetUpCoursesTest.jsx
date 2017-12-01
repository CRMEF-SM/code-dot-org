import React from 'react';
import {shallow} from 'enzyme';
import {assert} from '../../../util/configuredChai';
import Button from "@cdo/apps/templates/Button";
import SetUpCourses from '@cdo/apps/templates/studioHomepages/SetUpCourses';

describe('SetUpCourses', () => {
  it('renders as expected for a teacher', () => {
    const wrapper = shallow(
      <SetUpCourses isRtl={false} isTeacher={true}/>
    ).dive();
    assert(wrapper.containsMatchingElement(
      <div>
        <div>
          <div>
            Start learning
          </div>
          <div>
            Assign a course to your classroom or start your own course.
          </div>
        </div>
        <Button
          href={'/courses'}
          color={Button.ButtonColor.gray}
          text={'Find a course'}
        />
        <div/>
      </div>
    ));
  });

  it('renders as expected for a student', () => {
    const wrapper = shallow(
      <SetUpCourses isRtl={false} isTeacher={false}/>
    ).dive();
    assert(wrapper.containsMatchingElement(
      <div>
        <div>
          <div>
            Start learning
          </div>
          <div>
            Browse Code.org's courses to find your next challenge.
          </div>
          </div>
          <Button
            href={'/courses'}
            color={Button.ButtonColor.gray}
            text={'Find a course'}
          />
        <div/>
      </div>
    ));
  });
});
