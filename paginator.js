function paginator(qq, pageNumber, pageSize, continuationToken) {
    var collection = getContext().getCollection();
    var total = 0;
    var documents = [];

    tryQuery(continuationToken);

    function tryQuery(nextContinuationToken) {
        var responseOptions = { continuation: nextContinuationToken };

        if (!query(responseOptions)) {
            setBody(nextContinuationToken);
        }
    }

    function query(responseOptions) {
        return (qq && qq.length) ?
            collection.queryDocuments(collection.getSelfLink(), qq, responseOptions, onReadDocuments) :
            collection.readDocuments(collection.getSelfLink(), responseOptions, onReadDocuments);
    }

    function onReadDocuments(err, docFeed, responseOptions) {
        if (err) {
            throw 'Error while reading document: ' + err;
        }

        for (var x = 0; x < docFeed.length; x++)
        {
            if (x >= ((pageNumber - 1) * pageSize) &&
                x < pageNumber * pageSize) {
                documents.push(docFeed[x]);
            }
            
            total++;
        }
        
        if (responseOptions.continuation) {
            tryQuery(responseOptions.continuation);
        } else {
            setBody(null);
        }
    }

    function setBody(continuationToken) {
        var body = { total: total, items: documents, continuationToken: continuationToken };
        getContext().getResponse().setBody(body);
    }
}
