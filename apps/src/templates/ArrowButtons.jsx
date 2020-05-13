import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

const styles = {
  hidden: {display: 'none'},
  visible: {display: 'inline-block'}
};

/**
 * A set of arrow buttons
 */
export class ArrowButtons extends React.Component {
  static propTypes = {
    // from redux
    visible: PropTypes.bool.required
  };

  render() {
    const style = this.props.visible ? styles.visible : styles.hidden;
    return (
      <div style={style} id="soft-buttons">
        <button type="button" id="leftButton" disabled className="arrow">
          <img src="/blockly/media/1x1.gif" className="left-btn icon21" />
        </button>
        <button type="button" id="rightButton" disabled className="arrow">
          <img src="/blockly/media/1x1.gif" className="right-btn icon21" />
        </button>
        <button type="button" id="upButton" disabled className="arrow">
          <img src="/blockly/media/1x1.gif" className="up-btn icon21" />
        </button>
        <button type="button" id="downButton" disabled className="arrow">
          <img src="/blockly/media/1x1.gif" className="down-btn icon21" />
        </button>
      </div>
    );
  }
}

export default connect(state => ({
  visible: state.arrowDisplay.buttonsAreVisible
}))(ArrowButtons);
