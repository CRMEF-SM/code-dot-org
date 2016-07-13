import React from 'react';
import BaseDialog from '../../templates/BaseDialog';
import AdvancedShareOptions from './AdvancedShareOptions';
import AbuseError from './abuse_error';
import SendToPhone from './SendToPhone';

function select(event) {
  event.target.select();
}

const styles = {
  abuseStyle: {
    border: '1px solid',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20
  },
  abuseTextStyle: {
    color: '#b94a48',
    fontSize: 14
  },
};

/**
 * Share Dialog used by projects
 */
var ShareDialog = React.createClass({
  propTypes: {
    i18n: React.PropTypes.shape({
      t: React.PropTypes.func.isRequired,
    }).isRequired,
    icon: React.PropTypes.string,
    shareUrl: React.PropTypes.string.isRequired,
    isAbusive: React.PropTypes.bool.isRequired,
    channelId: React.PropTypes.string.isRequired,
    appType: React.PropTypes.string.isRequired,
    onClickPopup: React.PropTypes.func.isRequired,
    onClickExport: React.PropTypes.func,
    hideBackdrop: BaseDialog.propTypes.hideBackdrop,
  },

  getInitialState: function () {
    return {
      isOpen: true,
      showSendToPhone: false,
      showAdvancedOptions: false,
      exporting: false,
      exportError: null,
    };
  },

  componentWillReceiveProps: function (newProps) {
    this.setState({isOpen: true});
  },

  close: function () {
    this.setState({isOpen: false});
  },

  showSendToPhone: function (event) {
    this.setState({
      showSendToPhone: true,
      showAdvancedOptions: false,
    });
    event.preventDefault();
  },

  showAdvancedOptions() {
    this.setState({
      showSendToPhone: false,
      showAdvancedOptions: true,
    });
  },

  clickExport: function () {
    this.setState({exporting: true});
    this.props.onClickExport().then(
      () => this.setState({exporting: false}),
      () => {
        this.setState({
          exporting: false,
          exportError: 'Failed to export project. Please try again later.'
        });
      }
    );
  },

  render: function () {
    var image;
    var modalClass = 'modal-content';
    if (this.props.icon) {
      image = <img className="modal-image" src={this.props.icon}/>;
    } else {
      modalClass += ' no-modal-icon';
    }

    var facebookShareUrl = "https://www.facebook.com/sharer/sharer.php?u=" +
                           encodeURIComponent(this.props.shareUrl);
    var twitterShareUrl = "https://twitter.com/intent/tweet?url=" +
                          encodeURIComponent(this.props.shareUrl) +
                          "&amp;text=Check%20out%20what%20I%20made%20@codeorg" +
                          "&amp;hashtags=HourOfCode&amp;related=codeorg";

    return (
      <BaseDialog
          useDeprecatedGlobalStyles
          isOpen={this.state.isOpen}
          handleClose={this.close}
          hideBackdrop={this.props.hideBackdrop}>
        <div>
          {image}
          <div id="project-share" className={modalClass} style={{position: 'relative'}}>
            <p className="dialog-title">{this.props.i18n.t('project.share_title')}</p>
            {this.props.isAbusive &&
             <AbuseError
                 i18n={{
                     tos: this.props.i18n.t('project.abuse.tos'),
                     contact_us: this.props.i18n.t('project.abuse.contact_us')
                   }}
                 className='alert-error'
                 style={styles.abuseStyle}
                 textStyle={styles.abuseTextStyle}/>}
            <p style={{fontSize: 20}}>
              {this.props.i18n.t('project.share_copy_link')}
            </p>
            <div style={{marginBottom: 10}}>
              <input
                  type="text"
                  id="sharing-input"
                  onClick={select}
                  readOnly="true"
                  value={this.props.shareUrl}
                  style={{cursor: 'copy', width: 465}}/>
            </div>
            <div className="social-buttons">
              <a id="sharing-phone" href="" onClick={this.showSendToPhone}>
                <i className="fa fa-mobile-phone" style={{fontSize: 36}}></i>
                <span>Send to phone</span>
              </a>
              <a href={facebookShareUrl}
                 target="_blank"
                 onClick={this.props.onClickPopup.bind(this)}>
                <i className="fa fa-facebook"></i>
              </a>
              <a href={twitterShareUrl} target="_blank" onClick={this.props.onClickPopup.bind(this)}>
                <i className="fa fa-twitter"></i>
              </a>
            </div>
            {this.state.showSendToPhone &&
             <SendToPhone
                 channelId={this.props.channelId}
                 appType={this.props.appType}
                 styles={{label:{marginTop: 15, marginBottom: 0}}}
             />}
            {this.props.appType === 'applab' &&
             <AdvancedShareOptions
                 i18n={this.props.i18n}
                 onClickExport={this.props.onClickExport}
                 expanded={this.state.showAdvancedOptions}
                 onExpand={this.showAdvancedOptions}
             />}
            {/* Awkward that this is called continue-button, when text is
            close, but id is (unfortunately) used for styling */}
            <button
                id="continue-button"
                style={{position: 'absolute', right: 0, bottom: 0, margin: 0}}
                onClick={this.close}>
              {this.props.i18n.t('project.close')}
            </button>
          </div>
        </div>
      </BaseDialog>
    );
  }
});
module.exports = ShareDialog;

if (BUILD_STYLEGUIDE) {
  const fakei18n = {
    t(s) {
      return {
        'project.share_title': 'Share your project',
        'project.share_copy_link': 'Copy the link:',
        'project.close': 'Close',
        'project.advanced_share': 'Show advanced options',
        'project.embed': 'Embed',
        'project.share_embed_description': 'You can paste the embed code into an HTML page to display the project on a webpage.',
      }[s] || `<i18n>${s}</i18n>` ;
    }
  };

  ShareDialog.styleGuideExamples = storybook => {
    storybook
      .storiesOf('ShareDialog', module)
      .addStoryTable([
        {
          name: 'basic example',
          story: () => (
            <ShareDialog
                hideBackdrop={true}
                i18n={fakei18n}
                shareUrl="https://studio.code.org/projects/applab/GmBgH7e811sZP7-5bALAxQ"
                isAbusive={false}
                channelId="some-id"
                appType="gamelab"
                onClickPopup={storybook.action('onClickPopup')}
            />
          )
        }, {
          name: 'applab',
          description: `The applab version has an advanced sharing dialog with more options`,
          story: () => (
            <ShareDialog
                hideBackdrop={true}
                i18n={fakei18n}
                shareUrl="https://studio.code.org/projects/applab/GmBgH7e811sZP7-5bALAxQ"
                isAbusive={false}
                channelId="some-id"
                appType="applab"
                onClickPopup={storybook.action('onClickPopup')}
            />
          )
        }, {
          name: 'with export',
          description: `This feature has not yet shipped.`,
          story: () => (
            <ShareDialog
                hideBackdrop={true}
                i18n={fakei18n}
                shareUrl="https://studio.code.org/projects/applab/GmBgH7e811sZP7-5bALAxQ"
                isAbusive={false}
                channelId="some-id"
                appType="applab"
                onClickPopup={storybook.action('onClickPopup')}
                onClickExport={storybook.action('onClickExport')}
            />
          )
        }, {
          name: 'abusive',
          description: `The abusive version shows a warning message`,
          story: () => (
            <ShareDialog
                hideBackdrop={true}
                i18n={fakei18n}
                shareUrl="https://studio.code.org/projects/applab/GmBgH7e811sZP7-5bALAxQ"
                isAbusive={true}
                channelId="some-id"
                appType="gamelab"
                onClickPopup={storybook.action('onClickPopup')}
            />
          )
        }, {
          name: 'with icon',
          description: `An icon can be specifid for the dialog`,
          story: () => (
            <ShareDialog
                hideBackdrop={true}
                icon="https://studio.code.org/blockly/media/skins/pvz/static_avatar.png"
                i18n={fakei18n}
                shareUrl="https://studio.code.org/projects/applab/GmBgH7e811sZP7-5bALAxQ"
                isAbusive={false}
                channelId="some-id"
                appType="gamelab"
                onClickPopup={storybook.action('onClickPopup')}
            />
          )
        }
      ]);
  };
}
