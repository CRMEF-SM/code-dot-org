import React from 'react';
import ManageStudentsTable from './ManageStudentsTable';

const passwordAccountData = [
  {
    id: 1,
    name: 'Caley',
    username: 'student1',
    userType: 'student',
    age: 17,
    gender: 'f',
    loginType: 'password',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  },
  {
    id: 2,
    name: 'Mehal',
    username: 'student2',
    userType: 'student',
    age: 14,
    gender: 'm',
    loginType: 'password',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  },
  {
    id: 3,
    name: 'Brad',
    username: 'student3',
    userType: 'student',
    age: 9,
    gender: 'm',
    loginType: 'password',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  }
];

const wordAccountData = [
  {
    id: 1,
    name: 'Sung',
    username: 'student1',
    userType: 'student',
    age: 12,
    gender: 'f',
    loginType: 'word',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  },
  {
    id: 2,
    name: 'Josh',
    username: 'student2',
    userType: 'student',
    age: 16,
    gender: 'm',
    loginType: 'word',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  },
  {
    id: 3,
    name: 'Tanya',
    username: 'student3',
    userType: 'student',
    age: 10,
    gender: 'f',
    loginType: 'word',
    secretWords: 'wizard',
    secretPictureName: 'wizard',
    secretPicturePath: '/wizard.jpg',
    sectionId: 53,
  }
];

export default storybook => {
  storybook
    .storiesOf('ManageStudentsTable', module)
    .addStoryTable([
      {
        name: 'Manage Students Table',
        description: 'Table for password accounts',
        story: () => (
          <ManageStudentsTable
            studentData={passwordAccountData}
            id={53}
            loginType={"email"}
          />
        )
      },
      {
        name: 'Manage Students Table',
        description: 'Table for word accounts',
        story: () => (
          <ManageStudentsTable
            studentData={wordAccountData}
            id={53}
            loginType={"word"}
          />
        )
      },
    ]);
};
