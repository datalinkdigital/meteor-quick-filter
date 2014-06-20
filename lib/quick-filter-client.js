QuickFilter = function(index, collection, subsManager, settings) {
    var self = this;
    var _collection = collection;
    var _settings = settings || {};
    var _iconBool = (_settings.iconBool) ? _settings.iconBool : ['fa fa-bars', 'fa fa-check text-success', 'fa fa-times text-danger'];
    var _bgBool = (_settings.bgBool) ? _settings.bgBool : ['', '', ''];
    var _iconOrder = (_settings.iconOrder) ? _settings.iconOrder : ['fa fa-sort', 'fa fa-sort-amount-asc', 'fa fa-sort-amount-desc'];
    var _bgOrder = (_settings.bgOrder) ? _settings.bgOrder : ['', '', ''];

    var _searchByFields = _settings.searchFields || [];

    var _template = _settings.template || null;
    var _templateFilter = _settings.templateFilter || null;

    self.subs = null;
    var _sesName = index;

    var publisherResultsId = 'qf-' + _sesName + '-res';
    var publisherCountId = 'qf-' + _sesName + '-cnt';
    var publisherFilterCountId = 'qf-' + _sesName + '-filtercnt';

    var _schema = _collection.simpleSchema().schema();

    var _data = {
        keyword: _settings.keyword || null,
        searchByFields: [],
        fields: {},
        fieldsArr: [],
        count: 0,
        fullCount: 0,
        limit: _settings.limit || 8,
        inc: _settings.inc || 8,
        show: 0,
        sort: _settings.sort || [
            ['createdOn', 'asc']
        ],
        filter: _settings.filter || [],
        fullCount: _settings.fullCount || false,
        customSelector: false
    }



    var _calculateSort = function() {
        _.each(_data.sort, function(val, idx) {
            if (_data.fields[val[0]]) {
                _data.fields[val[0]].sort = val[1];
                _data.fields[val[0]].sortIdx = idx;
                if (!val[1] || val[1] === "") {
                    _data.fields[val[0]].sort = false;
                }
            }
        });
    };

    var _createFieldsArr = function() {
        _data.fieldsArr = [];
        _.each(_data.fields, function(val, idx) {
            var obj = _.clone(val);
            obj.id = idx;
            _data.fieldsArr.push(obj);
            if (obj.allowSearch) {
                _data.searchFieldsArr.push(obj);
            }

        });
    };
    var _genSortArr = function() {
        _data.sort = [];
        _data.sortFields = _.sortBy(_data.fieldsArr, function(val) {
            return val.sortIdx;
        });
        _.each(_data.sortFields, function(val, idx) {
            _data.fields[val.id].sortIdx = idx;
            _data.sort.push([val.id, _data.fields[val.id].sort]);
            val.sortIcon = _iconOrder[0];
            if (val.sort) {
                if (val.sort === "asc") {
                    val.sortIcon = _iconOrder[1];
                    val.sortBg = _bgOrder[1];
                }

                if (val.sort === "desc") {
                    val.sortIcon = _iconOrder[2];
                    val.sortBg = _bgOrder[2];
                }
            }
        });
    };


    _data.fields = _.clone(_schema);;
    _.each(_schema, function(val, idx) {
        _data.fields[idx].sort = false;
        _data.fields[idx].sortIdx = 9999;
        _data.fields[idx].search = false;
        _data.fields[idx].allowSearch = false;
        var _found = _.find(_searchByFields, function(val) {
            return val[0] == idx
        });
        if (_found !== undefined) {
            _data.fields[idx].allowSearch = true;
            if (_found) {
                _data.fields[idx].search = true;
            }
        }


    });

    _calculateSort();
    _createFieldsArr();
    _genSortArr();

    var _callbacks = {
        beforeSubscribe: (_settings.callbacks && _settings.callbacks.beforeSubscribe) ? _settings.callbacks.beforeSubscribe : null,
        afterSubscribe: (_settings.callbacks && _settings.callbacks.afterSubscribe) ? _settings.callbacks.afterSubscribe : null,
        beforeResults: (_settings.callbacks && _settings.callbacks.beforeResults) ? _settings.callbacks.beforeResults : null,
        afterResults: (_settings.callbacks && _settings.callbacks.afterResults) ? _settings.callbacks.afterResults : null,
        templateCreated: (_settings.callbacks && _settings.callbacks.templateCreated) ? _settings.callbacks.templateCreated : null,
        templateRendered: (_settings.callbacks && _settings.callbacks.templateRendered) ? _settings.callbacks.templateRendered : null,
        templateDestroyed: (_settings.callbacks && _settings.callbacks.templateDestroyed) ? _settings.callbacks.templateDestroyed : null,
    };



    var _swapSort = function(idx1, idx2) {
        if (idx1 !== undefined && idx2 !== undefined) {
            var tmp1 = _data.sort[idx1];
            var tmp2 = _data.sort[idx2];
            _data.sort[idx1] = tmp2;
            _data.sort[idx2] = tmp1;
            self.search();
        }
    };

    var _switchSort = function(idx) {
        if (idx !== undefined) {
            if (_data.sort[idx][1] === undefined || _data.sort[idx][1] === false || _data.sort[idx][1] === null || _data.sort[idx][1] === '') {
                _data.sort[idx][1] = 'asc';
            } else {

                if (_data.sort[idx][1] === 'asc') {
                    _data.sort[idx][1] = 'desc';
                } else {
                    _data.sort[idx][1] = false;
                }
            }

            self.search();
        }
    };

    self.search = function() {
        IronRouterProgress.start();
        _calculateSort();
        _createFieldsArr();
        _genSortArr();

        _data.searchByFields = [];
        var _searchByFieldsQuery = [];

        _.each(_data.fields, function(val, idx) {
            if (val.allowSearch) {
                var _obj = val;
                _obj.id = idx;

                _data.searchByFields.push(_obj);
            }

            if (val.allowSearch && val.search) {
                _searchByFieldsQuery.push(idx);
            }
        });

        var queryObj = {};


        queryObj.keyword = _data.keyword || false;
        queryObj.searchFields = _searchByFieldsQuery || [];
        queryObj.sort = _data.sort || [];
        queryObj.limit = _data.limit || 10;
        queryObj.filter = _data.filter || [];
        queryObj.customSelector = _data.customSelector || false;
        queryObj.fullCount = query.fullCount || false;



        if (_.isFunction(_callbacks.beforeSubscribe)) {
            _data = _callbacks.beforeSubscribe(_data) || _data;
        }

        self.subs = subsManager.subscribe(publisherResultsId, queryObj);

        if (self.subs && self.subs.ready()) {
            _data.count = Counts.get(publisherFilterCountId);
            _data.fullCount = Counts.get(publisherCountId);
            _data.show = _data.limit;
            if (_data.count < _data.limit) {
                _data.show = _data.count;
            }
            _data.lastUpdate = Date.now();
            Session.set(_sesName + 'lastUpdate', _data.lastUpdate);
            IronRouterProgress.done();
            if (_.isFunction(_callbacks.afterSubscribe)) {
                _callbacks.afterSubscribe(null, this);
            }
        }

    };

    self.setLimit = function(limit) {
        _data.limit = limit || 10;
        self.search();
    };
    self.setSort = function(sort) {
        _data.sort = sort || [
            ['createdOn', 'asc']
        ];
        self.search();
    };

    self.setKeyword = function(keyword) {
        _data.keyword = keyword || null;
        self.search();
    };

    self.setCustomSelector = function(selector) {
        _data.customSelector = selector || false;
        self.search();
    };

    self.setFilter = function(filter) {
        _data.filter = filter || [];
        self.search();
    };

    self.getData = function() {
        var change = Session.get(_sesName + 'lastUpdate');
        if (change) {
            return _data;
        }
        return {};
    };
    self.getCursor = function() {
        var change = Session.get(_sesName + 'lastUpdate');

        if (change && _data.result) {
            var _options = {
                sort: _data.sort
            };
            var selector = _data.result.split(',');
            return collection.find({
                _id: {
                    $in: selector
                }
            }, _options);

        }
        return null

    };
    self.loadMore = function() {
        if (_data.count > _data.show) {
            _data.limit += _data.inc;
            self.search();
        }
    };

    if (Template[_template]) {
        var objEvt = {};
        objEvt['click .loadMore' + _sesName] = function(e, tpl) {
            e.preventDefault();
            self.loadMore();

        };
        Template[_template].events(objEvt);
        Template[_template].destroyed = function() {

            if (_.isFunction(_callbacks.templateDestroyed)) {
                _callbacks.templateDestroyed(this);
            }
        };


    }

    if (Template[_templateFilter]) {

        Template[_templateFilter].events({
            'mouseenter .dropDownHover': function(e, tpl) {
                e.preventDefault();
                $(e.target).addClass('open');

            },

            'mouseleave .dropDownHover': function(e, tpl) {
                e.preventDefault();
                $(e.target).removeClass('open');

            },
            'submit .searchForm': function(e, tpl) {
                e.preventDefault();
                var self = this;
                var inputName = "";
                var itemval = null;
                var item = e.target;
                inputName = "keyword"
                itemval = $(item).find('[name=' + inputName + ']').val();
                self.setKeyword(itemval);

            },
            'keyup .searchForm input': function(e, tpl) {
                var itemval = null;
                itemval = $(e.target).val();
                self.setKeyword(itemval);
            },
            'click .toggleSearchBy': function(e, tpl) {
                e.preventDefault();
                if (this.id && _data.fields[this.id]) {
                    _data.fields[this.id].search = !_data.fields[this.id].search;
                    self.search();
                }

            },
            'click .sortSwitch': function(e, tpl) {
                e.preventDefault();
                if (this.sortIdx !== undefined) {
                    _switchSort(this.sortIdx);
                }

            },
            'click .sortUp': function(e, tpl) {
                e.preventDefault();
                if (this.sortIdx > 0) {
                    _swapSort((this.sortIdx - 1), this.sortIdx);

                }


            },
            'click .sortDown': function(e, tpl) {
                e.preventDefault();
                if (this.sortIdx < _data.sort.length - 1) {
                    _swapSort((this.sortIdx + 1), this.sortIdx);

                }


            },

        });

        Template[_templateFilter].helpers({
            data: function() {
                var change = Session.get(_sesName + 'lastUpdate');
                if (change) {
                    return _data;
                }
                return {};
            },
            hideSortUp: function() {

                if (this.sortIdx > 0) {
                    return false;
                }
                return true;
            },
            hideSortDown: function() {

                if (this.sortIdx < _data.sort.length - 1) {
                    return false;
                }
                return true;
            }

        });


    }
    self.search();

};
