// VIE Widgets - Vienna IKS Editable Widgets
// (c) 2011 Sebastian Germesin, IKS Consortium
// VIE Widgets may be freely distributed under the MIT license.
// (see LICENSE)

(function($, undefined) {
    $.widget('view.vieAutoTag', {
        
        _create: function () {
            var self = this;
            for (var s in this.options.services) {
                if (this.options.services[s].service && typeof this.options.services[s].service === "function") {
                    var options = 
                        (this.options.services[s].options)? 
                                this.options.services[s].options : {};
                    options.name = s;
                    this.options.vie.use(new this.options.services[s].service(options));
                }
            }
            return this;
        },
        
        _init: function () {
            this.triggerTagging();
            return this;
        },
        
        triggerTagging : function () {
            var self = this;
            var bucket = $(this.element);
            var elem = $(this.options.element);
            
            if (!self.options.append) {
                self.options.entities = [];
            }
            
            for (var s in this.options.services) {
                var service = this.options.services[s];
                if (!this.options.services[s].use) {
                    continue;
                }
                this.options.vie.analyze({element: elem})
                .using(s).execute()
                .done(function (entities) {
                    self.options.entities = self.options.entities.concat(entities);
                    self._unduplicateEntities();
                    var render = (self.options.render)? self.options.render : self._render;
                    render.call(self, self.options.entities);
                })
                .fail(function (e) {
                    console.warn(e);
                });

                this._trigger('start_query', undefined, {service : s, time: new Date()});
            }
            return this;
        },
        
        _render: function (entities) {
            var self = this;
            self.options.label = ($.isArray(self.options.label))? self.options.label : [ self.options.label ];
            
            var ul = $('<ul>');
            for (var e = 0; e < entities.length; e++) {
                var li = $("<li>");
                var label = undefined;
                var filtered = (self.options.filter.length > 0);
                for (var f = 0; f < self.options.filter.length; f++) {
                    if (entities[e].isof(self.options.filter[f])) {
                        filtered = false;
                        break;
                    }
                }
                if (!filtered) {
                    for (var l = 0; l < self.options.label.length; l++) {
                        var la = self.options.label[l];
                        if (typeof la === "string") {
                            var type = la.split(".")[0];
                            var prop = la.split(".")[1];
                            if (entities[e].isof(type) &&
                                entities[e].has(prop)) {
                                label = self._extractString(entities[e], [ prop ], self.options.lang);
                                break;
                            }
                        } else if (typeof la === "function") {
                            if (la(entities[e])) {
                                label = la(entities[e]);
                                break;
                            }
                        }
                    }
                
                    if (!label) {
                        label = entities[e].id.replace(/</, "&lt;");
                    }
                    
                    li
                    .addClass("tag")
                    .attr("title", entities[e].id.replace(/</g, '').replace(/>/g, ''))
                    .text(label)
                    .appendTo(ul);
                }
            }
            $(this.element).empty().append(ul);
            
            return this;
        },
        
        _unduplicateEntities: function () {
            for (var i = 0; i < this.options.entities.length; i++) {
                var iid = this.options.entities[i].getSubject();
                for (var j = i+1; j < this.options.entities.length; j++) {
                    var jid = this.options.entities[j].getSubject();
                    if (iid === jid) {
                        this.options.entities.splice(j, 1);
                        j--;
                    }
                }
            }
            return this;
        },
        
        _extractString : function(entity, attrs, lang) {
            lang = (lang)? lang : this.options.lang;
            lang  = (jQuery.isArray(lang))? lang : [ lang ];
            for (var l = 0; l < lang.length; l++) {
                if (entity && typeof entity !== "string") {
                    var possibleAttrs = (_.isArray(attrs))? attrs : [ attrs ];
                    for (var p = 0; p < possibleAttrs.length; p++) {
                        var attr = possibleAttrs[p];
                        if (entity.has(attr)) {
                            var name = entity.get(attr);
                            if (name.isCollection) {
                                name.each(function (model) {
                                    var val = model.get("value");
                                    if (val.indexOf('@' + lang[l]) > -1) {
                                        name = val;
                                        return true;
                                    }
                                });
                                if (name.isCollection) {
                                    name = name.at(0).get("value");
                                }
                            }
                            else if (jQuery.isArray(name) && name.length > 0) {
                                for ( var i = 0; i < name.length; i++) {
                                    if (name[i].indexOf('@' + lang[l]) > -1) {
                                        name = name[i];
                                        break;
                                    }
                                }
                                if (jQuery.isArray(name))
                                    name = name[0]; // just take the first
                            }
                            return (name) ? name.replace(/"/g, "").replace(/@[a-z]+/, '').trim() : name;
                        }
                    }
                }
            }
            return undefined;
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
                    options: {
                        url : "http://dev.iks-project.eu:8081"
                    }
                },
                'rdfa' : {
                    use: false
                }
            },
            
            
            // helper
            render: undefined,
            entities: [],
            
            // events
            start_query: function () {},
            end_query: function () {}
        }
        
    });
})(jQuery);