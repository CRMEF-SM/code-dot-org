require File.expand_path('../boot', __FILE__)
require File.expand_path('../deployment', __FILE__)
require 'cdo/poste'
require 'rails/all'

require 'cdo/geocoder'
require 'cdo/properties'
require 'varnish_environment'
require 'assets_api'
require 'channels_api'
require 'properties_api'
require 'tables_api'
require 'shared_resources'

require 'cdo/rack/deflater'
require 'cdo/rack/https_redirect'
require 'cdo/rack/upgrade_insecure_requests'
require 'bootstrap-sass'
require 'cdo/hash'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(:default, Rails.env)

module Dashboard
  class Application < Rails::Application

    config.middleware.insert_after Rails::Rack::Logger, VarnishEnvironment
    config.middleware.insert_after VarnishEnvironment, AssetsApi
    config.middleware.insert_after AssetsApi, ChannelsApi
    config.middleware.insert_after ChannelsApi, PropertiesApi
    config.middleware.insert_after PropertiesApi, TablesApi
    config.middleware.insert_after TablesApi, SharedResources
    if CDO.dashboard_enable_pegasus
      require 'pegasus_sites'
      config.middleware.insert_after SharedResources, PegasusSites
    end

    unless Rails.env.production?
      config.middleware.use ::Rack::UpgradeInsecureRequests
      config.middleware.use ::Rack::ContentLength
    end

    config.encoding = 'utf-8'

    Rails.application.routes.default_url_options[:host] = CDO.canonical_hostname('studio.code.org')

    config.generators do |g|
      g.template_engine :haml
    end
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # By default, config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    config.i18n.enforce_available_locales = false
    config.i18n.available_locales = ['en']
    config.i18n.fallbacks = {}
    config.i18n.default_locale = 'en-us'
    locales = YAML.load_file("#{Rails.root}/config/locales.yml")
    LOCALES = Hash[locales.map {|k, v| [k.downcase, v.class == String ? v.downcase : v]}]
    LOCALES.each do |locale, data|
      next unless data.is_a? Hash
      data.symbolize_keys!
      unless data[:debug] && Rails.env.production?
        config.i18n.available_locales << locale
      end
      if data[:fallback]
        config.i18n.fallbacks[locale] = data[:fallback]
      end
    end

    config.prize_providers = YAML.load_file("#{Rails.root}/config/prize_providers.yml")

    # Hack for cache busting.
    # Extracts version number from package.json of Blockly apps.
    # See also Blockly#cache_bust.
    cache_bust_path = Rails.root.join('.cache_bust')
    ::CACHE_BUST = File.read(cache_bust_path).strip.gsub('.', '_') rescue ''

    config.assets.paths << Rails.root.join('../shared/css')

    config.assets.precompile += %w(
      epiceditor/*.css
      editor/markdown_editor.css
      editor/markdown_editor.js
      editor/blockly_editor.css
      editor/blockly_editor.js
      levels/*
      react.js
      jquery.handsontable.full.css
      jquery.handsontable.full.js
      video-js.swf vjs.eot vjs.svg vjs.ttf vjs.woff
    )
    config.react.variant = :development
    config.react.addons = true
    config.autoload_paths << Rails.root.join('lib')
  end
end
