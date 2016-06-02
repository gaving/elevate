/**
 *   DisplayFlyByFeedModifier is responsible of ...
 */
function DisplayFlyByFeedModifier(appResources) {
    this.appResources = appResources;
}

/**
 * Define prototype
 */
DisplayFlyByFeedModifier.prototype = {

    modify: function modify() {

        var displayFlyByFeedModifier = function() {

            var self = this;
            // Add flyby button in dashboard
            $('.entry-container>h3>a[href*=activities]').each(function() {

                if (!$(this).parent().parent().find('.sx-flyby').length) {

                    var activityId = $(this).attr('href').split('/')[2];

                    var transText = Helper.formatMessage(self.appResources.globalizeInstance, 'menu/go_to_flyby');
                    var html = '<a href="#" title="FlyBy" class="sx-flyby">' + transText + '</a>';
                    $(this).parent().parent().find('.btn-group').after('</br></br>' + html + '</br></br>').each(function() {

                        $(this).parent().parent().find('.sx-flyby').click(function() {
                            window.open('http://labs.strava.com/flyby/viewer/?utm_source=strava_activity_header#' + activityId);
                        });

                    }.bind(this));
                }
            });

        }.bind(this);

        setInterval(displayFlyByFeedModifier, 750);
    },
};