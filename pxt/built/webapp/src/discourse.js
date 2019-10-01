"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function extractSharedIdFromPostUrl(url) {
    // https://docs.discourse.org/#tag/Posts%2Fpaths%2F~1posts~1%7Bid%7D.json%2Fget
    return pxt.Util.httpGetJsonAsync(url + ".json")
        .then(function (json) {
        // extract from post_stream
        var projectId = json.post_stream
            && json.post_stream.posts
            && json.post_stream.posts[0]
            && json.post_stream.posts[0].link_counts
                .map(function (link) { return pxt.Cloud.parseScriptId(link.url); })
                .filter(function (id) { return !!id; })[0];
        return projectId;
    });
}
exports.extractSharedIdFromPostUrl = extractSharedIdFromPostUrl;
