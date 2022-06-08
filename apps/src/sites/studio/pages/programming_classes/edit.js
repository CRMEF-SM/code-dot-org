import React from 'react';
import ReactDOM from 'react-dom';
import getScriptData from '@cdo/apps/util/getScriptData';
import ProgrammingClassEditor from '@cdo/apps/lib/levelbuilder/code-docs-editor/ProgrammingClassEditor';
import ExpandableImageDialog from '@cdo/apps/templates/lessonOverview/ExpandableImageDialog';
import instructionsDialog from '@cdo/apps/redux/instructionsDialog';
import {getStore, registerReducers} from '@cdo/apps/redux';
import {Provider} from 'react-redux';

$(document).ready(() => {
  registerReducers({
    instructionsDialog
  });
  const store = getStore();

  const programmingClass = getScriptData('programmingClass');
  const environmentCategories = getScriptData('environmentCategories');
  const videoOptions = getScriptData('videoOptions');
  ReactDOM.render(
    <Provider store={store}>
      <>
        <ProgrammingClassEditor
          initialProgrammingClass={programmingClass}
          environmentCategories={environmentCategories}
          videoOptions={videoOptions}
        />
        <ExpandableImageDialog />
      </>
    </Provider>,
    document.getElementById('edit-container')
  );
});
