$(function(){

    $.getQueryParam = function(name, url) {
        if (!url) { url = window.location.search; }
        else {
            var m = url.match(/\?.*$/);
            if (m && m.length > 0) { url = m[0]; }
        }
        var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' ')) || false;
    }

    $.frontadmin = (function(){
        var $self = this;
        
        $self.states = {
            initialized: false,
            toolbars_visibles: false,
            active_frame: false
        };

        $self.bar = $('#frontadmin-bar-frame');
        $self.toolbars = $('.frontadmin-toolbar-frame');

        $self.buttons = {
            logout: '#frontadmin-btn-logout',
            toggle: '#frontadmin-btn-toggle',
            deleteObject: '#frontadmin-delete-object',
            changeObject: '#frontadmin-change-object, .frontadmin-change-object',
            objectHistory: '#frontadmin-history-object',
            changelist: '#frontadmin-changelist'
        };

        $self.clearSelection = function() {
            if(document.selection && document.selection.empty) {
                document.selection.empty();
            } else if(window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        };

        $self.getMainBarWidth = function(){
            var w = parseInt($(document).width() / 2.5);
            if (w < 600) { w = 600; }
            return w
        };

        $self.cookie = function(k, v) {
            if (v) { return $.cookie(k, v, {path: '/'}); }
            else   { return $.cookie(k,    {path: '/'}); }
        };

        $self.closeActiveFrame = function() {
            if (!$self.states.active_frame.hasClass('modified') || confirm('Close and discard modifications ?')) {
                $self.states.active_frame.parent().fadeOut(function(){
                    $self.states.active_frame.parent().remove();
                    $self.states.active_frame = false;
                })
            }
        };

        $self.hide = function(src) {
            var src = $(src),
                html = $('html'),
                bar = $('#frontadmin-bar-frame'),
                visible = html.hasClass('frontadmin-show-toolbars');

            if (!visible) { return true; }

            $self.states.toolbars_visibles = false;
            $self.cookie('frontadmin_toolbars_visibles', 'false');
            html.removeClass('frontadmin-show-toolbars');

            src.removeClass('active')
                  .attr('title', src.data('title-collapsed'))
                  .text('+');

            bar.addClass('minimized').animate({width: 36}).css('opacity', 0.5);

        };

        $self.show = function(src) {
            var src = $(src),
                html = $('html'),
                bar = $('#frontadmin-bar-frame'),
                visible = html.hasClass('frontadmin-show-toolbars');

            if (visible) { return true; }

            $self.states.toolbars_visibles = true;
            $self.cookie('frontadmin_toolbars_visibles', 'true');
            html.addClass('frontadmin-show-toolbars');

            src.addClass('active')
                  .attr('title', src.data('title'))
                  .text('-');

            bar.removeClass('minimized').animate({
                width: $self.getMainBarWidth()}).css('opacity', 1.0);
        };

        // frontadmin toolbar initial state
        if ($self.cookie('frontadmin_toolbars_visibles') == null) { 
            // Cookie does not exist, set it and show the toolbar by default
            $self.cookie('frontadmin_toolbars_visibles', 'true')
            $self.states.toolbars_visibles = true;
        }
        else if ($self.cookie('frontadmin_toolbars_visibles') == 'true') {
            $self.states.toolbars_visibles = true;
        }
        else {
            $self.states.toolbars_visibles = false;
        }
        $('#frontadmin-bar-frame').load(function(){
            var a = $(this).contents().find('#frontadmin-btn-toggle');
            if ($self.states.toolbars_visibles == true) {
                $self.show(a);
            }
            else {
                $self.hide(a);
            }
        });

        // Remove toolbars and useless stuff in window mode
        $self.cleanDocument = function(d) {
            // add cancel button
            var $this  = this;
            var cancel = $('<li class="cancel-button-container"><a class="cancel-link" href="#">Cancel</a></li>')
            cancel.find('a').bind('click.adminToolbar', function() {
                $self.closeActiveFrame();
                return false;
            })
            if (d.find('#changelist').get(0)) {
               var changelist = true;
               if (!d.find('#submit').find('.submit-row').get(0)) {
                   d.find('#submit').append('<ul class="submit-row" />');
               }
            }

            d.bind('keydown', function(e) {
                if (e.keyCode == 27) {
                    $self.closeActiveFrame();
                    return false;
                }
            })

            d.find('#header, #breadcrumbs').remove().end()
             .find('body').css({paddingTop: 0}).end()
             .find('.module.footer')
                 .css({
                      '-moz-border-radius': '0 0 4px 4px',
                      '-webkit-border-radius': '0 0 4px 4px',
                      'border-radius': '0 0 4px 4px'
                  })
                 .find('.submit-row').append(cancel).end()
                 .find('input[name="_continue"]').bind('click', function() {
                     $self.states.active_frame.addClass('saving continue')
                     $self.states.active_frame.parent().addClass('saving continue')
                     
                 }).end()
                 .find('input[name="_save"]').bind('click', function() {
                     $self.states.active_frame.addClass('saving')
                     $self.states.active_frame.parent().addClass('saving')
                 }).end()
                 .find('.delete-link').bind('click', function() {
                     $self.states.active_frame.addClass('deleting')
                 }).end()
                 .find('input[name="_addanother"]').parent().hide().end().end()
             .end();
        }

        $self.events = {

            // Readjust bar & toolbars on window resize
            onWindowResize: function(e) {
                $self.toolbars.each(function(){
                    $(this).width($(this).parent().width());
                })
                $self.bar.width($self.getMainBarWidth());
            },
            
            // Log the user out and hide frontadmin
            onLogout: function(e){
                $.get($(this).attr('href'), function(){
                    $self.bar.slideDown('fast', function(){
                        $(this).remove();
                        window.location.reload();
                    })
                })
                return false;
            },                

            // toggle frontadmin ui
            onToggleToolbar: function(e){
                var visible = $('html').hasClass('frontadmin-show-toolbars');
                if (visible) {
                    $self.hide(this) 
                } else {
                    $self.show(this);
                }
                return false;
            },

            onObjectChange: function(){
                var url = $(this).attr('href');
                var el = $(this);
                var bd = $(this).parents('body');
                var block = $("#frontadmin-"+ bd.find('#app_label').val()
                              +"-"+ bd.find('#object_name').val()
                              +"-"+ bd.find('#object_id').val());
                var content = block.find('.frontadmin-block-content');

                var inject = $.getQueryParam('inject', url);
                if (inject) {
                    var value = $.getQueryParam('value', url);
                    url = url.split('?')[0];
                }

                // Open iframe window
                $self.states.active_frame = $.iframeWindow(url, function() {
                    var frame  = $(this);
                    var doc    = frame.contents();
                    var msg    = doc.find('#container > .messagelist');
                    var url    = document.location.href + ' #'+ block.attr('id');
                    var errors = doc.find('.errornote').get(0);

                    $self.cleanDocument(doc);

                    if (inject && value) {
                        doc.find('#'+inject).val(value);
                    }

                    // Save button has been clicked
                    if ($(this).hasClass('saving')) {
                        if (!errors) {
                            content.load(url, function() {
                                content.find('.frontadmin-toolbar-frame').remove();
                                content = $(this).children().unwrap();
                                //$self.bindToolbarEvents(content.parent().find('iframe'))
                                //$.frontendMessage(msg.find('li:first').text())
                            });

                            if (!frame.hasClass('continue')) {
                                $self.closeActiveFrame();
                            } else {
                                frame.parent().removeClass('saving');
                                frame.removeClass('saving').removeClass('continue');
                            }
                        }
                    }
                    else if ($(this).hasClass('deleting')) {
                        // Delete button has been clicked
                        // User can now either cancel or confirm
                        var cancel = doc.find('.left.cancel-button-container').removeClass('left').remove();
                        doc.find('.cancel-button-container').replaceWith(cancel);
                        doc.find('.cancel-link').unbind('click')
                            .bind('click.adminToolbar', function(){
                                frame.removeClass('deleting').removeClass('deleted');
                            }).end().remove();
                        // Confirm delete
                        doc.find('.footer input[type=submit]').bind('click.adminToolbar', function() {
                            frame.removeClass('deleting').addClass('deleted');
                        })

                    }
                    else if (frame.hasClass('deleted')) {
                        frame.removeClass('deleted');
                        var errors = doc.find('.errornote').get(0);
                        if (!errors) {
                            $self.closeActiveFrame();
                            $.frontendMessage(msg.find('li:first').text());
                            block.slideUp('slow', function() {
                                $(this).remove();
                            })
                        }
                    }
                    else {
                        msg.find('li').css('border', 0);
                    }
                })
                return false;
            },

            onChangelist: function(){
                var url = $(this).attr('href');
                var el = $(this);
                var bd = $(this).parents('body');
                var block = $("#frontadmin-"+ bd.find('#app_label').val() 
                              +"-"+ bd.find('#app_model').val());
                var content = block.find('.frontadmin-block-content');

                // Open iframe window
                $self.states.active_frame = $.iframeWindow(url, function() {
                    var frame  = $(this);
                    var doc    = frame.contents();
                    var msg    = doc.find('#container > .messagelist');
                    var url    = document.location.href + ' #'+ block.attr('id');
                    var errors = doc.find('.errornote').get(0);

                    // Save button has been clicked
                    if (frame.hasClass('saving')) {
                        if (!errors) {
                            if (!frame.hasClass('continue')) {
                                $self.closeActiveFrame();
                            }
                            content.load(url, function() {
                                content.find('.frontadmin-toolbar-frame').remove()
                                content = frame.children().unwrap();
                                //$self.bindToolbarEvents(content.parent().find('iframe'))
                                //$.frontendMessage(msg.find('li:first').text())
                            });
                        }
                        frame.removeClass('saving').removeClass('continue');
                    }
                    else if ($(this).hasClass('deleting')) {
                        // Delete button has been clicked
                        // User can now either cancel or confirm
                        var cancel = doc.find('.left.cancel-button-container').removeClass('left').remove();
                        doc.find('.cancel-button-container').replaceWith(cancel);
                        doc.find('.cancel-link').unbind('click')
                            .bind('click.adminToolbar', function(){
                                frame.removeClass('deleting').removeClass('deleted');
                            }).end().remove();
                        // Confirm delete
                        doc.find('.footer input[type=submit]').bind('click.adminToolbar', function() {
                            frame.removeClass('deleting').addClass('deleted');
                        })

                    }
                    else if (frame.hasClass('deleted')) {
                        frame.removeClass('deleted');
                        var errors = doc.find('.errornote').get(0);
                        if (!errors) {
                            $self.closeActiveFrame();
                            $.frontendMessage(msg.find('li:first').text());
                            block.slideUp('slow', function() {
                                $(this).remove();
                            })
                        }
                    }
                    else {
                        msg.find('li').css('border', 0);
                    }
                })
                $self.states.active_frame.bind('load', function(){
                    $self.cleanDocument($self.states.active_frame.contents());
                })
                return false;
            },

            // Triggered when a toolbar delete button is clicked
            onObjectDelete: function() {
                var url = $(this).attr('href');
                var el = $(this);
                var bd = $(this).parents('body');
                var block = $("#frontadmin-"+ bd.find('#app_label').val() +"-"+ bd.find('#object_name').val() +"-"+ bd.find('#object_id').val());

                $self.states.active_frame = $.iframeWindow(url, function() {
                    var frame  = $(this);
                    var doc    = frame.contents();
                    var msg    = doc.find('#container > .messagelist');
                    var url    = document.location.href + ' #'+ block.attr('id');
                    var errors = doc.find('.errornote').get(0);

                    $self.cleanDocument(doc);

                    if (frame.hasClass('deleted')) {
                        frame.removeClass('deleted');
                        var errors = doc.find('.errornote').get(0);
                        if (!errors) {
                            $self.closeActiveFrame();
                            //$.frontendMessage(msg.find('li:first').text())
                            block.slideUp('slow', function() {
                                $(this).remove();
                            })
                        }
                    }
                    else {
                        var cancel = doc.find('.left.cancel-button-container').removeClass('left').remove();
                        doc.find('.cancel-button-container').replaceWith(cancel);
                        doc.find('.cancel-link').unbind('click')
                            .bind('click.adminToolbar', function(){
                                frame.removeClass('deleting').removeClass('deleted');
                                $self.closeActiveFrame();
                            }).end().remove();
                        // Confirm delete
                        doc.find('.footer input[type=submit]').bind('click.adminToolbar', function() {
                            frame.removeClass('deleting').addClass('deleted');
                        })
                    }
                })
                return false;
            },

            // Triggered when a toolbar historybutton is clicked
            onObjectHistory: function() {
                var url = $(this).attr('href');
                var el = $(this);
                var bd = $(this).parents('body');
                var ft = $([
                    '<div class="module footer">',
                        '<ul class="submit-row">',
                            '<li class="cancel-button-container"><a href="#" class="cancel-link">Close</a></li>',
                        '</ul><br clear="all">',
                    '</div>'].join(''));

                $self.states.active_frame = $.iframeWindow(url, function() {
                    var doc = $(this).contents();
                    $self.cleanDocument(doc);
                    doc.find('body').append(ft);
                    doc.find('.cancel-button-container').bind('click', function(){
                        $self.closeActiveFrame();
                    })
                })
                return false;
            }
        }

        $self.bindBarEvents = function() {
            var doc = $self.bar.contents();
            if ($('html').hasClass('frontadmin-show-toolbars')) {
                doc.find($self.buttons.toggle).addClass('active');
            }
            doc.find($self.buttons.changeObject).bind('click.frontadmin2', $self.events.onObjectChange).end();
            doc.find($self.buttons.logout).bind('click.frontadmin', $self.events.onLogout).end()
               .find($self.buttons.toggle).bind('click.frontadmin', $self.events.onToggleToolbar).end()
               .find($self.buttons.toggleBar).bind('click.frontadmin', $self.events.onToggleBar).end()
        }
        
        $self.bindToolbarEvents = function(toolbar) {
            function bind(tb){
                var doc = $(tb).contents();
                doc.find($self.buttons.deleteObject).bind('click.frontadmin',  $self.events.onObjectDelete).end()
                   .find($self.buttons.changeObject).bind('click.frontadmin',  $self.events.onObjectChange).end()
                   .find($self.buttons.objectHistory).bind('click.frontadmin', $self.events.onObjectHistory).end()
                   .find($self.buttons.changelist).bind('click.frontadmin',    $self.events.onChangelist).end();
            }
            if (toolbar) {
                bind(toolbar);
            }
            else {
                $.each($self.toolbars, function(){
                    bind(this);
                })
            }
        }

        return {
            init: function() {
                $('html').addClass('frontadmin');
                $self.bar.show();
                $(window).resize($self.events.onWindowResize);

                if ($self.states.toolbars_visibles) {
                    $self.bar.removeClass('minimized').fadeTo('fast', 1.0);
                    $self.events.onWindowResize();
                }
                else {
                    $self.bar.addClass('minimized').width(36).fadeTo('fast', 0.5);
                }

                // Little trick to load iframe content locally
                $self.bar.add($self.toolbars).each(function(){
                    $(this).contents().find('body').html($(this).text());
                })

                $('html')[($self.states.toolbars_visibles == true && 'addClass' || 'removeClass')]('frontadmin-show-toolbars');

                $self.bindBarEvents();
                $self.bindToolbarEvents();
                
                $('.frontadmin-block-content').bind('dblclick', function(){
                    var doc = $(this).parent().find('.frontadmin-toolbar-frame').contents();
                    $self.clearSelection();
                    $self.events.onObjectChange.apply(doc.find('#frontadmin-change-object').get(0));
                    return false;
                })

                $self.states.initialized = true;
            }
        }
    })()

    $.frontadmin.init();

    $.iframeWindow = function(src, callback, option) {
        var options  = options || {};
        var callback = callback || function(){};
        var iframe   = $('<iframe frameborder="0" />').attr('src', src).load(callback);
        var wrapper  = $('<div id="frontadmin-iframe-window">').append(iframe);

        wrapper.css({
            position: 'fixed',
            top: 50,
            left: 50,
            right: 50,
            bottom: 50,
           zIndex: 99999
        }).appendTo('body');
          
        var resize = function() {
            iframe.css({
                height: wrapper.height(),           
                width:  wrapper.width(),
            });
        };

        $(window).resize(resize).trigger('resize');

        return iframe;
    }
});
