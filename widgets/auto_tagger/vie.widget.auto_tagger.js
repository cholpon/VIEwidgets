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
        
        _init: function () {
            this.tagit();
        },
        
        useService : function (serviceId, use) {
        	if (this.options.services[serviceId]) {
        		this.options.services[serviceId]["use"] = (use === undefined)? true : use;
        	}
        },
        
        clear : function () {
        	if (widget.options.entities)
        		widget.options.entities.reset();
        	return this;
        },
        
        tagit : function () {
        	debugger;
            var widget = this;
            var $source = $(widget.element);
            
            if (!widget.options.append) {
            	widget.options.entities.reset();
            }
            
            var queryPerformed = false;
            _.each(widget.options.services, function (s) {
                widget.options.vie
                .analyze({element: $source})
                .using(s)
                .execute()
                .done(function (entities) {
                	widget.options.entities.addOrUpdate(entities);
                })
                .fail(function (e) {
                	widget._trigger('warn', undefined, {msg: e});
                });
                queryPerformed = true;
                widget._trigger('start_query', undefined, {service : s, time: new Date()});
            });
            if (queryPerformed) {
            	widget.options.timer = setTimeout(function (widget) {
                    return function () {
                        // discard all results that return after this timeout happened
                        widget.options.query_id++;
                    };
                }(widget), widget.options.timeout, "JavaScript");
            } else {
            	widget._trigger('error', undefined, {msg: "No services registered! Please use $(...).vieAutoTag('useService', 'stanbol', true)"});
            }
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
            bins        : [],
            services    : {
                'stanbol' : {
                    use: false,
                    instance : function () {
                    	
                    }
                },
                'zemanta' : {
                    use: false,
                    instance : function () {
                    	
                    }
                },
                'rdfa' : {
                    use: false,
                    instance : function () {
                    	
                    }
                }
            },
            
            // helper
            render: undefined,
            entities: undefined,
            query_id: 0,
            timeout : 10000,
            
            // events
            start_query : function () {},
            end_query   : function () {},
            warn        : function () {},
            error       : function () {}
        }
    });
})(jQuery);