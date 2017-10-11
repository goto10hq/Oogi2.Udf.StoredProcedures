function arrayContains(items, obj) {
    if (items !== null && 
    Object.prototype.toString.call(items) === '[object Array]' && 
    obj !== null && 
    typeof obj === 'object') {
        var props = Object.getOwnPropertyNames(obj);

        for(var x = 0; x < items.length; x++)
        {
            var item = items[x];
            var ok = true;

            for (var i = 0; i < props.length; i++) {
                var property = props[i];
            
                if (item[property] !== obj[property]) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                return true;
            }            
        }
        
        return false;
    } else {
        return false;
    }
}
