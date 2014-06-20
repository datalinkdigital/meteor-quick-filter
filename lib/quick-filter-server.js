QuickFilter = {};

QuickFilter.publish = function(index, collection, options) {
    var self = this;

    options = options || {};

    var callbacks = options.callbacks || {};

    var name = index;

    var publisherResultsId = 'qf-' + name + '-res';
    var publisherCountId = 'qf-' + name + '-cnt';
    var publisherFilterCountId = 'qf-' + name + '-filtercnt';

    Meteor.publish(publisherResultsId, function(query) {

        var allow = true;

        if (callbacks.allow && _.isFunction(callbacks.allow))
            allow = callbacks.allow(query, this);

        if (!allow) {
            throw new Meteor.Error(417, 'Not allowed');
        }

        query = (query && !_.isEmpty(query)) ? query : {};


        query.keyword = query.keyword || false;
        query.searchFields = query.searchFields || [];
        query.sort = query.sort || [];
        query.limit = query.limit || 8;
        query.filter = query.filter || [];
        query.customSelector = query.customSelector || false;
        query.fullCount = query.fullCount || false;

        //query builder
        var _selector = {};
        var _options = {
            skip: 0,
            limit: query.limit
        };

        if (query.sort && query.sort.constructor.name === "Array" && query.sort.length > 0) {
            _options.sort = query.sort;
        }

        if (query.customSelector) {
            _selector = query.customSelector;

        } else {

            if (query.filter && query.filter.constructor.name === "Array" && query.filter.length > 0) {
                _selector['$and'] = query.filter;
            }

            var _searchQuery = false;

            if (query.searchFields && query.filter.constructor.name === "Array" && query.searchFields.length > 0 &&
                query.keyword && query.keyword.constructor.name === "String" && query.keyword.length > 0) {

                query.keyword = {
                    '$regex': (".*" + query.search + ".*"),
                    '$options': 'i'
                };
                _searchQuery = {};

                if (query.searchFields.length > 1) {
                    _selector['$or'] = [];

                    _.each(query.searchFields, function(val, idx) {
                        var _obj = {};
                        _obj[val] = query.keyword;
                        _searchQuery.$or.push(_obj);
                    });
                } else {
                    _searchQuery[query.searchFields[0]] = query.keyword;
                }

                if (_selector['$and']) {
                    _selector['$and'].push(_searchQuery);
                } else {
                    _selector = _searchQuery;
                }
            }

        }

        if (callbacks.beforePublish && _.isFunction(callbacks.beforePublish))
            query = callbacks.beforePublish(query, this) || query;


        publishCount(this, publisherFilterCountId, collection.find(_selector, {
            fields: {
                _id: true
            }
        }), {
            noReady: true
        });

        if (query.fullCount) {
            publishCount(this, publisherCountId, collection.find({}, {
                fields: {
                    _id: true
                }
            }), {
                noReady: true
            });
        }

        var cursor = collection.find(_selector, _options);

        if (callbacks.afterPublish && _.isFunction(callbacks.afterPublish))
            cursor = callbacks.afterPublish('results', cursor, this) || cursor;

        return cursor;
    });


};
