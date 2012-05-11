// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieAutoTag', {
    	
    	_create: function () {
            var widget = this;
            
            widget.options.entities = new widget.options.vie.Collection();
            return this;
        },
        
        clear : function () {
        	if (widget.options.entities)
        		widget.options.entities.reset();
        	return this;
        },
        
        tagit : function (elem) {
        	debugger;
            var widget = this;
            var $source = $(elem);
            var $target = $(widget.element);
            
            if (!widget.options.append) {
            	widget.options.entities.reset();
            }
            
            var queryId = new Date().getTime();
            
            _.each(widget.options.services, function (s) {
                widget.options.vie
                .analyze({element: elem})
                .using(s)
                .execute()
                .done(function (entities) {
                	widget.options.entities.addOrUpdate(entities);
                })
                .fail(function (e) {
                    console.warn(e);
                });
            });
//            widget._trigger('start_query', undefined, {service : s, time: new Date()});
            return this;
        },
        
        _unduplicateEntities: function (entities) {
            for (var i = 0; i < entities.length; i++) {
                var iid = entities[i].getSubject();
                for (var j = i+1; j < entities.length; j++) {
                    var jid = entities[j].getSubject();
                    if (iid === jid) {
                    	entities.splice(j, 1);
                        j--;
                    }
                }
            }
            return entities;
        },
                
        options: {
            vie         : new VIE(),
            lang        : ["en"],
            append      : true,
            label       : [],
            filter      : [],
            services    : {
                'stanbol' : {
                    use: false,
                },
                'rdfa' : {
                    use: false
                }
            },
            
            // helper
            render: undefined,
            entities: undefined,
            
            // events
            start_query: function () {},
            end_query: function () {}
        }
        
    });
})(jQuery);