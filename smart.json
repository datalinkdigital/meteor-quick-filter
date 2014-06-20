Package.describe({
    summary: "Simple quick filter"
});

Package.on_use(function(api, where) {
    api.use(['underscore', 'simple-schema', 'collection2', 'publish-counts', 'subs-manager', 'meteor',
        'standard-app-packages'
    ], ['client', 'server']);

    api.add_files('lib/quick-filter-server.js', 'server');
    api.add_files('lib/quick-filter-client.js', 'client');
});
