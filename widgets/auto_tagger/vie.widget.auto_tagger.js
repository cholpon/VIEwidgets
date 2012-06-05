// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieAutoTag', {
    	
    	_create: function () {
            var widget = this;
            widget.clear();
            
            return this;
        },
                
        useService : function (serviceId, use) {
        	if (this.options.services[serviceId]) {
        		this.options.services[serviceId]["use"] = (use === undefined)? true : use;
        	}
        },
        
        clear : function () {
            var widget = this;
            _.each(widget.options.bins, function (b) {
                $(b.element).empty();
            });
            widget.options.entities = new widget.options.vie.Collection();
            
            widget.options.entities.on("add", function(entity) {
                _.each(widget.options.bins, function (b) {
                    if (_.isString(b.filter))
                        b.filter = [ b.filter ];
                    if (_.isArray(b.filter)) {
                        var applies = false;
                        _.each (b.filter, function (f) {
                            applies |= entity.isof(f);
                        });
                        if (applies) {
                            var render = new widget.Renderer({model : entity, template : b.label, widget : widget});
                            b.element.append(render.$el);
                        }
                    } else if (_.isFunction(b.filter) && b.filter(entity)) {
                        var render = new widget.Renderer({model : entity, template : b.label, widget : widget});
                        b.element.append(render.$el);
                    }
                });
            });
        	return this;
        },
        
        Renderer : 
            Backbone.View.extend({
                
                tagName: "li",
                
                className: "tag",

                events: {
                  "click": "destroy"
                },
                
                initialize: function () {
                    this.render();
                },
                
                destroy : function () {
                    this.$el.hide().remove();
                    this.options.widget.options.entities.remove(this.model);
                },

                render: function() {
                    var entity = this.model;
                    this.options.template = _.isString(this.options.template)? [ this.options.template ] : this.options.template;
                    if (_.isArray(this.options.template)) {
                        var label = VIE.Util.getPreferredLangForPreferredProperty(entity, this.options.template, this.options.widget.options.lang);
                        if (label) {
                            this.$el.text(label);
                        } else {
                            this.options.widget._trigger('warn', undefined, {msg: "Could not render label for entity " + entity.id});
                        }                        
                    } else if (_.isFunction(this.options.template)) {
                        var label = this.options.template.call(this.options.widget, entity);
                        if (label) {
                            this.$el.text(label);
                        } else {
                            this.options.widget._trigger('warn', undefined, {msg: "Could not render label for entity " + entity.id});
                        }
                    }
                    return this;
                }
            }),
        
        tagit : function () {
            var widget = this;
            var $source = $(widget.element);
            
            if (!widget.options.append) {
            	widget.clear();
            }
            
            var queryPerformed = false;
            _.each(widget.options.services, function (s, name) {
                if (!s.use)
                    return true;
                var serviceInstance = 
                    widget.options.vie.services[name] ? 
                            widget.options.vie.services[name] : 
                                function () {
                                    var inst = s.instance.call(widget);
                                    widget.options.vie.use(inst, name);
                                    return inst;
                            }();
                if (serviceInstance) {
                    widget.options.vie
                    .analyze({element: $source})
                    .using(name)
                    .execute()
                    .done(function (serviceName) {
                        return function (entities) {
                        	widget.options.entities.add(entities);
                            widget._trigger('end_query', undefined, {service : serviceName, time: new Date(), result : entities});
                        };
                    }(name))
                    .fail(function (e) {
                    	widget._trigger('warn', undefined, {msg: e});
                    });
                    queryPerformed = true;
                    widget._trigger('start_query', undefined, {service : name, time: new Date()});
                }
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
            lang        : ["en", "de", "es", "fr"],
            append      : true,
            bins        : 
                [{
                    element : $('body'),
                    filter: ["Thing"],
                    label: ["name", "rdf:label"]
            }],
            services    : {
                'stanbol' : {
                    use: false,
                    url : ["http://dev.iks-project.eu/stanbolfull"],
                    instance : function () {
                    	return new this.options.vie.StanbolService({
                            url: this.options.services.stanbol.url
                        });
                    }
                },
                'zemanta' : {
                    use: false,
                    api_key : undefined,
                    instance : function () {
                        return new this.options.vie.ZemantaService({
                            api_key: this.options.services.zemanta.api_key
                        });
                    }
                },
                'rdfa' : {
                    use: false,
                    instance : function () {
                        return new this.options.vie.RdfaService();
                    }
                }
            },
            // helper
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