function (memo) {
    var OLAPCube, _populateDependentValues, arrayOfMaps_To_CSVStyleArray, collection, context, csvStyleArray_To_ArrayOfMaps, functions, onReadDocuments, query, setBody, theCube, utils;
    utils = {};
    utils.assert = function(exp, message) {
      if (!exp) {
        throw new Error(message);
      }
    };
    utils.match = function(obj1, obj2) {
      var key, value;
      for (key in obj1) {
        value = obj1[key];
        if (value !== obj2[key]) {
          return false;
        }
      }
      return true;
    };
    utils.exactMatch = function(a, b) {
      var atype, btype, key, val;
      if (a === b) {
        return true;
      }
      atype = typeof a;
      btype = typeof b;
      if (atype !== btype) {
        return false;
      }
      if ((!a && b) || (a && !b)) {
        return false;
      }
      if (atype !== 'object') {
        return false;
      }
      if (a.length && (a.length !== b.length)) {
        return false;
      }
      for (key in a) {
        val = a[key];
        if (!(key in b) || !exactMatch(val, b[key])) {
          return false;
        }
      }
      return true;
    };
    utils.filterMatch = function(obj1, obj2) {
      var key, value;
      if (!(type(obj1) === 'object' && type(obj2) === 'object')) {
        throw new Error('obj1 and obj2 must both be objects when calling filterMatch');
      }
      for (key in obj1) {
        value = obj1[key];
        if (!exactMatch(value, obj2[key])) {
          return false;
        }
      }
      return true;
    };
    utils.trim = function(val) {
      if (String.prototype.trim != null) {
        return val.trim();
      } else {
        return val.replace(/^\s+|\s+$/g, "");
      }
    };
    utils.startsWith = function(bigString, potentialStartString) {
      return bigString.substring(0, potentialStartString.length) === potentialStartString;
    };
    utils.isArray = function(a) {
      return Object.prototype.toString.apply(a) === '[object Array]';
    };
    utils.type = (function() {
      var classToType, j, len1, name, ref;
      classToType = {};
      ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
      for (j = 0, len1 = ref.length; j < len1; j++) {
        name = ref[j];
        classToType["[object " + name + "]"] = name.toLowerCase();
      }
      return function(obj) {
        var strType;
        strType = Object.prototype.toString.call(obj);
        return classToType[strType] || "object";
      };
    })();
    utils.clone = function(obj) {
      var flags, key, newInstance;
      if ((obj == null) || typeof obj !== 'object') {
        return obj;
      }
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      if (obj instanceof RegExp) {
        flags = '';
        if (obj.global != null) {
          flags += 'g';
        }
        if (obj.ignoreCase != null) {
          flags += 'i';
        }
        if (obj.multiline != null) {
          flags += 'm';
        }
        if (obj.sticky != null) {
          flags += 'y';
        }
        return new RegExp(obj.source, flags);
      }
      newInstance = new obj.constructor();
      for (key in obj) {
        newInstance[key] = utils.clone(obj[key]);
      }
      return newInstance;
    };
    utils.keys = Object.keys || function(obj) {
      var key, val;
      return (function() {
        var results;
        results = [];
        for (key in obj) {
          val = obj[key];
          results.push(key);
        }
        return results;
      })();
    };
    utils.values = function(obj) {
      var key, val;
      return (function() {
        var results;
        results = [];
        for (key in obj) {
          val = obj[key];
          results.push(val);
        }
        return results;
      })();
    };
    utils.compare = function(a, b) {
      var aString, bString, index, j, len1, value;
      if (a === null) {
        return 1;
      }
      if (b === null) {
        return -1;
      }
      switch (type(a)) {
        case 'number':
        case 'boolean':
        case 'date':
          return b - a;
        case 'array':
          for (index = j = 0, len1 = a.length; j < len1; index = ++j) {
            value = a[index];
            if (b.length - 1 >= index && value < b[index]) {
              return 1;
            }
            if (b.length - 1 >= index && value > b[index]) {
              return -1;
            }
          }
          if (a.length < b.length) {
            return 1;
          } else if (a.length > b.length) {
            return -1;
          } else {
            return 0;
          }
          break;
        case 'object':
        case 'string':
          aString = JSON.stringify(a);
          bString = JSON.stringify(b);
          if (aString < bString) {
            return 1;
          } else if (aString > bString) {
            return -1;
          } else {
            return 0;
          }
          break;
        default:
          throw new Error("Do not know how to sort objects of type " + (utils.type(a)) + ".");
      }
    };
    csvStyleArray_To_ArrayOfMaps = function(csvStyleArray, rowKeys) {

      /*
      @method csvStyleArray_To_ArrayOfMaps
      @param {Array[]} csvStyleArray The first row is usually the list of column headers but if not, you can
        provide your own such list in the second parameter
      @param {String[]} [rowKeys] specify the column headers like `['column1', 'column2']`. If not provided, it will use
        the first row of the csvStyleArray
      @return {Object[]}
      
      `csvStyleArry_To_ArryOfMaps` is a convenience function that will convert a csvStyleArray like:
      
          {csvStyleArray_To_ArrayOfMaps} = require('../')
      
          csvStyleArray = [
            ['column1', 'column2'],
            [1         , 2       ],
            [3         , 4       ],
            [5         , 6       ]
          ]
      
      to an Array of Maps like this:
      
          console.log(csvStyleArray_To_ArrayOfMaps(csvStyleArray))
      
           * [ { column1: 1, column2: 2 },
           *   { column1: 3, column2: 4 },
           *   { column1: 5, column2: 6 } ]
      `
       */
      var arrayOfMaps, i, index, inputRow, j, key, len1, outputRow, tableLength;
      arrayOfMaps = [];
      if (rowKeys != null) {
        i = 0;
      } else {
        rowKeys = csvStyleArray[0];
        i = 1;
      }
      tableLength = csvStyleArray.length;
      while (i < tableLength) {
        inputRow = csvStyleArray[i];
        outputRow = {};
        for (index = j = 0, len1 = rowKeys.length; j < len1; index = ++j) {
          key = rowKeys[index];
          outputRow[key] = inputRow[index];
        }
        arrayOfMaps.push(outputRow);
        i++;
      }
      return arrayOfMaps;
    };
    arrayOfMaps_To_CSVStyleArray = function(arrayOfMaps, keys) {

      /*
      @method arrayOfMaps_To_CSVStyleArray
      @param {Object[]} arrayOfMaps
      @param {Object} [keys] If not provided, it will use the first row and get all fields
      @return {Array[]} The first row will be the column headers
      
      `arrayOfMaps_To_CSVStyleArray` is a convenience function that will convert an array of maps like:
      
          {arrayOfMaps_To_CSVStyleArray} = require('../')
      
          arrayOfMaps = [
            {column1: 10000, column2: 20000},
            {column1: 30000, column2: 40000},
            {column1: 50000, column2: 60000}
          ]
      
      to a CSV-style array like this:
      
          console.log(arrayOfMaps_To_CSVStyleArray(arrayOfMaps))
      
           * [ [ 'column1', 'column2' ],
           *   [ 10000, 20000 ],
           *   [ 30000, 40000 ],
           *   [ 50000, 60000 ] ]
      `
       */
      var csvStyleArray, inRow, j, key, l, len1, len2, outRow, ref, value;
      if (arrayOfMaps.length === 0) {
        return [];
      }
      csvStyleArray = [];
      outRow = [];
      if (keys == null) {
        keys = [];
        ref = arrayOfMaps[0];
        for (key in ref) {
          value = ref[key];
          keys.push(key);
        }
      }
      csvStyleArray.push(keys);
      for (j = 0, len1 = arrayOfMaps.length; j < len1; j++) {
        inRow = arrayOfMaps[j];
        outRow = [];
        for (l = 0, len2 = keys.length; l < len2; l++) {
          key = keys[l];
          outRow.push(inRow[key]);
        }
        csvStyleArray.push(outRow);
      }
      return csvStyleArray;
    };
    _populateDependentValues = function(values, dependencies, dependentValues, prefix) {
      var d, j, key, len1, out;
      if (dependentValues == null) {
        dependentValues = {};
      }
      if (prefix == null) {
        prefix = '';
      }
      out = {};
      for (j = 0, len1 = dependencies.length; j < len1; j++) {
        d = dependencies[j];
        if (d === 'count') {
          if (prefix === '') {
            key = 'count';
          } else {
            key = '_count';
          }
        } else {
          key = prefix + d;
        }
        if (dependentValues[key] == null) {
          dependentValues[key] = functions[d](values, void 0, void 0, dependentValues, prefix);
        }
        out[d] = dependentValues[key];
      }
      return out;
    };

    /*
    @method sum
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The sum of the values
     */

    /*
    @class functions
    
    Rules about dependencies:
    
      * If a function can be calculated incrementally from an oldResult and newValues, then you do not need to specify dependencies
      * If a funciton can be calculated from other incrementally calculable results, then you need only specify those dependencies
      * If a function needs the full list of values to be calculated (like percentile coverage), then you must specify 'values'
      * To support the direct passing in of OLAP cube cells, you can provide a prefix (field name) so the key in dependentValues
        can be generated
      * 'count' is special and does not use a prefix because it is not dependent up a particular field
      * You should calculate the dependencies before you calculate the thing that is depedent. The OLAP cube does some
        checking to confirm you've done this.
     */
    functions = {};
    functions.sum = function(values, oldResult, newValues) {
      var j, len1, temp, tempValues, v;
      if (oldResult != null) {
        temp = oldResult;
        tempValues = newValues;
      } else {
        temp = 0;
        tempValues = values;
      }
      for (j = 0, len1 = tempValues.length; j < len1; j++) {
        v = tempValues[j];
        temp += v;
      }
      return temp;
    };

    /*
    @method product
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The product of the values
     */
    functions.product = function(values, oldResult, newValues) {
      var j, len1, temp, tempValues, v;
      if (oldResult != null) {
        temp = oldResult;
        tempValues = newValues;
      } else {
        temp = 1;
        tempValues = values;
      }
      for (j = 0, len1 = tempValues.length; j < len1; j++) {
        v = tempValues[j];
        temp = temp * v;
      }
      return temp;
    };

    /*
    @method sumSquares
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The sum of the squares of the values
     */
    functions.sumSquares = function(values, oldResult, newValues) {
      var j, len1, temp, tempValues, v;
      if (oldResult != null) {
        temp = oldResult;
        tempValues = newValues;
      } else {
        temp = 0;
        tempValues = values;
      }
      for (j = 0, len1 = tempValues.length; j < len1; j++) {
        v = tempValues[j];
        temp += v * v;
      }
      return temp;
    };

    /*
    @method sumCubes
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The sum of the cubes of the values
     */
    functions.sumCubes = function(values, oldResult, newValues) {
      var j, len1, temp, tempValues, v;
      if (oldResult != null) {
        temp = oldResult;
        tempValues = newValues;
      } else {
        temp = 0;
        tempValues = values;
      }
      for (j = 0, len1 = tempValues.length; j < len1; j++) {
        v = tempValues[j];
        temp += v * v * v;
      }
      return temp;
    };

    /*
    @method lastValue
    @static
    @param {Number[]} [values] Must either provide values or newValues
    @param {Number} [oldResult] Not used. It is included to make the interface consistent.
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The last value
     */
    functions.lastValue = function(values, oldResult, newValues) {
      if (newValues != null) {
        return newValues[newValues.length - 1];
      }
      return values[values.length - 1];
    };

    /*
    @method firstValue
    @static
    @param {Number[]} [values] Must either provide values or oldResult
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] Not used. It is included to make the interface consistent.
    @return {Number} The first value
     */
    functions.firstValue = function(values, oldResult, newValues) {
      if (oldResult != null) {
        return oldResult;
      }
      return values[0];
    };

    /*
    @method count
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The length of the values Array
     */
    functions.count = function(values, oldResult, newValues) {
      if (oldResult != null) {
        return oldResult + newValues.length;
      }
      return values.length;
    };

    /*
    @method min
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The minimum value or null if no values
     */
    functions.min = function(values, oldResult, newValues) {
      var j, len1, temp, v;
      if (oldResult != null) {
        return functions.min(newValues.concat([oldResult]));
      }
      if (values.length === 0) {
        return null;
      }
      temp = values[0];
      for (j = 0, len1 = values.length; j < len1; j++) {
        v = values[j];
        if (v < temp) {
          temp = v;
        }
      }
      return temp;
    };

    /*
    @method max
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Number} The maximum value or null if no values
     */
    functions.max = function(values, oldResult, newValues) {
      var j, len1, temp, v;
      if (oldResult != null) {
        return functions.max(newValues.concat([oldResult]));
      }
      if (values.length === 0) {
        return null;
      }
      temp = values[0];
      for (j = 0, len1 = values.length; j < len1; j++) {
        v = values[j];
        if (v > temp) {
          temp = v;
        }
      }
      return temp;
    };

    /*
    @method values
    @static
    @param {Object[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Array} All values (allows duplicates). Can be used for drill down.
     */
    functions.values = function(values, oldResult, newValues) {
      if (oldResult != null) {
        return oldResult.concat(newValues);
      }
      return values;
    };

    /*
    @method uniqueValues
    @static
    @param {Object[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] for incremental calculation
    @param {Number[]} [newValues] for incremental calculation
    @return {Array} Unique values. This is good for generating an OLAP dimension or drill down.
     */
    functions.uniqueValues = function(values, oldResult, newValues) {
      var j, key, l, len1, len2, r, temp, temp2, tempValues, v, value;
      temp = {};
      if (oldResult != null) {
        for (j = 0, len1 = oldResult.length; j < len1; j++) {
          r = oldResult[j];
          temp[r] = null;
        }
        tempValues = newValues;
      } else {
        tempValues = values;
      }
      temp2 = [];
      for (l = 0, len2 = tempValues.length; l < len2; l++) {
        v = tempValues[l];
        temp[v] = null;
      }
      for (key in temp) {
        value = temp[key];
        temp2.push(key);
      }
      return temp2;
    };

    /*
    @method average
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] not used by this function but included so all functions have a consistent signature
    @param {Number[]} [newValues] not used by this function but included so all functions have a consistent signature
    @param {Object} [dependentValues] If the function can be calculated from the results of other functions, this allows
      you to provide those pre-calculated values.
    @return {Number} The arithmetic mean
     */
    functions.average = function(values, oldResult, newValues, dependentValues, prefix) {
      var count, ref, sum;
      ref = _populateDependentValues(values, functions.average.dependencies, dependentValues, prefix), count = ref.count, sum = ref.sum;
      if (count === 0) {
        return null;
      } else {
        return sum / count;
      }
    };
    functions.average.dependencies = ['count', 'sum'];

    /*
    @method errorSquared
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] not used by this function but included so all functions have a consistent signature
    @param {Number[]} [newValues] not used by this function but included so all functions have a consistent signature
    @param {Object} [dependentValues] If the function can be calculated from the results of other functions, this allows
      you to provide those pre-calculated values.
    @return {Number} The error squared
     */
    functions.errorSquared = function(values, oldResult, newValues, dependentValues, prefix) {
      var count, difference, errorSquared, j, len1, mean, ref, sum, v;
      ref = _populateDependentValues(values, functions.errorSquared.dependencies, dependentValues, prefix), count = ref.count, sum = ref.sum;
      mean = sum / count;
      errorSquared = 0;
      for (j = 0, len1 = values.length; j < len1; j++) {
        v = values[j];
        difference = v - mean;
        errorSquared += difference * difference;
      }
      return errorSquared;
    };
    functions.errorSquared.dependencies = ['count', 'sum'];

    /*
    @method variance
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] not used by this function but included so all functions have a consistent signature
    @param {Number[]} [newValues] not used by this function but included so all functions have a consistent signature
    @param {Object} [dependentValues] If the function can be calculated from the results of other functions, this allows
      you to provide those pre-calculated values.
    @return {Number} The variance
     */
    functions.variance = function(values, oldResult, newValues, dependentValues, prefix) {
      var count, ref, sum, sumSquares;
      ref = _populateDependentValues(values, functions.variance.dependencies, dependentValues, prefix), count = ref.count, sum = ref.sum, sumSquares = ref.sumSquares;
      if (count === 0) {
        return null;
      } else if (count === 1) {
        return 0;
      } else {
        return (count * sumSquares - sum * sum) / (count * (count - 1));
      }
    };
    functions.variance.dependencies = ['count', 'sum', 'sumSquares'];

    /*
    @method standardDeviation
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] not used by this function but included so all functions have a consistent signature
    @param {Number[]} [newValues] not used by this function but included so all functions have a consistent signature
    @param {Object} [dependentValues] If the function can be calculated from the results of other functions, this allows
      you to provide those pre-calculated values.
    @return {Number} The standard deviation
     */
    functions.standardDeviation = function(values, oldResult, newValues, dependentValues, prefix) {
      return Math.sqrt(functions.variance(values, oldResult, newValues, dependentValues, prefix));
    };
    functions.standardDeviation.dependencies = functions.variance.dependencies;

    /*
    @method percentileCreator
    @static
    @param {Number} p The percentile for the resulting function (50 = median, 75, 99, etc.)
    @return {Function} A function to calculate the percentile
    
    When the user passes in `p<n>` as an aggregation function, this `percentileCreator` is called to return the appropriate
    percentile function. The returned function will find the `<n>`th percentile where `<n>` is some number in the form of
    `##[.##]`. (e.g. `p40`, `p99`, `p99.9`).
    
    There is no official definition of percentile. The most popular choices differ in the interpolation algorithm that they
    use. The function returned by this `percentileCreator` uses the Excel interpolation algorithm which differs from the NIST
    primary method. However, NIST lists something very similar to the Excel approach as an acceptible alternative. The only
    difference seems to be for the edge case for when you have only two data points in your data set. Agreement with Excel,
    NIST's acceptance of it as an alternative (almost), and the fact that it makes the most sense to me is why this approach
    was chosen.
    
    http://en.wikipedia.org/wiki/Percentile#Alternative_methods
    
    Note: `median` is an alias for p50. The approach chosen for calculating p50 gives you the
    exact same result as the definition for median even for edge cases like sets with only one or two data points.
     */
    functions.percentileCreator = function(p) {
      var f;
      f = function(values, oldResult, newValues, dependentValues, prefix) {
        var d, k, n, sortfunc, vLength;
        if (values == null) {
          values = _populateDependentValues(values, ['values'], dependentValues, prefix).values;
        }
        if (values.length === 0) {
          return null;
        }
        sortfunc = function(a, b) {
          return a - b;
        };
        vLength = values.length;
        values.sort(sortfunc);
        n = (p * (vLength - 1) / 100) + 1;
        k = Math.floor(n);
        d = n - k;
        if (n === 1) {
          return values[1 - 1];
        }
        if (n === vLength) {
          return values[vLength - 1];
        }
        return values[k - 1] + d * (values[k] - values[k - 1]);
      };
      f.dependencies = ['values'];
      return f;
    };

    /*
    @method median
    @static
    @param {Number[]} [values] Must either provide values or oldResult and newValues
    @param {Number} [oldResult] not used by this function but included so all functions have a consistent signature
    @param {Number[]} [newValues] not used by this function but included so all functions have a consistent signature
    @param {Object} [dependentValues] If the function can be calculated from the results of other functions, this allows
      you to provide those pre-calculated values.
    @return {Number} The median
     */
    functions.median = functions.percentileCreator(50);
    functions.expandFandAs = function(a) {

      /*
      @method expandFandAs
      @static
      @param {Object} a Will look like this `{as: 'mySum', f: 'sum', field: 'Points'}`
      @return {Object} returns the expanded specification
      
      Takes specifications for functions and expands them to include the actual function and 'as'. If you do not provide
      an 'as' property, it will build it from the field name and function with an underscore between. Also, if the
      'f' provided is a string, it is copied over to the 'metric' property before the 'f' property is replaced with the
      actual function. `{field: 'a', f: 'sum'}` would expand to `{as: 'a_sum', field: 'a', metric: 'sum', f: [Function]}`.
       */
      var p;
      utils.assert(a.f != null, "'f' missing from specification: \n" + (JSON.stringify(a, void 0, 4)));
      if (utils.type(a.f) === 'function') {
        throw new Error('User defined metric functions not supported in a stored procedure');
        utils.assert(a.as != null, 'Must provide "as" field with your aggregation when providing a user defined function');
        a.metric = a.f.toString();
      } else if (functions[a.f] != null) {
        a.metric = a.f;
        a.f = functions[a.f];
      } else if (a.f.substr(0, 1) === 'p') {
        a.metric = a.f;
        p = /\p(\d+(.\d+)?)/.exec(a.f)[1];
        a.f = functions.percentileCreator(Number(p));
      } else {
        throw new Error(a.f + " is not a recognized built-in function");
      }
      if (a.as == null) {
        if (a.metric === 'count') {
          a.field = '';
          a.metric = 'count';
        }
        a.as = a.field + "_" + a.metric;
        utils.assert((a.field != null) || a.f === 'count', "'field' missing from specification: \n" + (JSON.stringify(a, void 0, 4)));
      }
      return a;
    };
    functions.expandMetrics = function(metrics, addCountIfMissing, addValuesForCustomFunctions) {
      var assureDependenciesAbove, confirmMetricAbove, countRow, dependencies, hasCount, index, j, l, len1, len2, m, metricsRow, valuesRow;
      if (metrics == null) {
        metrics = [];
      }
      if (addCountIfMissing == null) {
        addCountIfMissing = false;
      }
      if (addValuesForCustomFunctions == null) {
        addValuesForCustomFunctions = false;
      }

      /*
      @method expandMetrics
      @static
      @private
      
      This is called internally by several Lumenize Calculators. You should probably not call it.
       */
      confirmMetricAbove = function(m, fieldName, aboveThisIndex) {
        var currentRow, i, lookingFor, metricsLength;
        if (m === 'count') {
          lookingFor = '_' + m;
        } else {
          lookingFor = fieldName + '_' + m;
        }
        i = 0;
        while (i < aboveThisIndex) {
          currentRow = metrics[i];
          if (currentRow.as === lookingFor) {
            return true;
          }
          i++;
        }
        i = aboveThisIndex + 1;
        metricsLength = metrics.length;
        while (i < metricsLength) {
          currentRow = metrics[i];
          if (currentRow.as === lookingFor) {
            throw new Error("Depdencies must appear before the metric they are dependant upon. " + m + " appears after.");
          }
          i++;
        }
        return false;
      };
      assureDependenciesAbove = function(dependencies, fieldName, aboveThisIndex) {
        var d, j, len1, newRow;
        for (j = 0, len1 = dependencies.length; j < len1; j++) {
          d = dependencies[j];
          if (!confirmMetricAbove(d, fieldName, aboveThisIndex)) {
            if (d === 'count') {
              newRow = {
                f: 'count'
              };
            } else {
              newRow = {
                f: d,
                field: fieldName
              };
            }
            functions.expandFandAs(newRow);
            metrics.unshift(newRow);
            return false;
          }
        }
        return true;
      };
      if (addValuesForCustomFunctions) {
        for (index = j = 0, len1 = metrics.length; j < len1; index = ++j) {
          m = metrics[index];
          if (utils.type(m.f) === 'function') {
            if (m.f.dependencies == null) {
              m.f.dependencies = [];
            }
            if (m.f.dependencies[0] !== 'values') {
              m.f.dependencies.push('values');
            }
            if (!confirmMetricAbove('values', m.field, index)) {
              valuesRow = {
                f: 'values',
                field: m.field
              };
              functions.expandFandAs(valuesRow);
              metrics.unshift(valuesRow);
            }
          }
        }
      }
      hasCount = false;
      for (l = 0, len2 = metrics.length; l < len2; l++) {
        m = metrics[l];
        functions.expandFandAs(m);
        if (m.metric === 'count') {
          hasCount = true;
        }
      }
      if (addCountIfMissing && !hasCount) {
        countRow = {
          f: 'count'
        };
        functions.expandFandAs(countRow);
        metrics.unshift(countRow);
      }
      index = 0;
      while (index < metrics.length) {
        metricsRow = metrics[index];
        if (utils.type(metricsRow.f) === 'function') {
          dependencies = ['values'];
        }
        if (metricsRow.f.dependencies != null) {
          if (!assureDependenciesAbove(metricsRow.f.dependencies, metricsRow.field, index)) {
            index = -1;
          }
        }
        index++;
      }
      return metrics;
    };
    OLAPCube = (function() {

      /*
      @class OLAPCube
      
      __An efficient, in-memory, incrementally-updateable, hierarchy-capable OLAP Cube implementation.__
      
      [OLAP Cubes](http://en.wikipedia.org/wiki/OLAP_cube) are a powerful abstraction that makes it easier to do everything
      from simple group-by operations to more complex multi-dimensional and hierarchical analysis. This implementation has
      the same conceptual ancestry as implementations found in business intelligence and OLAP database solutions. However,
      it is meant as a light weight alternative primarily targeting the goal of making it easier for developers to implement
      desired analysis. It also supports serialization and incremental updating so it's ideally
      suited for visualizations and analysis that are updated on a periodic or even continuous basis.
      
      ## Features ##
      
      * In-memory
      * Incrementally-updateable
      * Serialize (`getStateForSaving()`) and deserialize (`newFromSavedState()`) to preserve aggregations between sessions
      * Accepts simple JavaScript Objects as facts
      * Storage and output as simple JavaScript Arrays of Objects
      * Hierarchy (trees) derived from fact data assuming [materialized path](http://en.wikipedia.org/wiki/Materialized_path)
        array model commonly used with NoSQL databases
      
      ## 2D Example ##
      
      Let's walk through a simple 2D example from facts to output. Let's say you have this set of facts:
      
          facts = [
            {ProjectHierarchy: [1, 2, 3], Priority: 1, Points: 10},
            {ProjectHierarchy: [1, 2, 4], Priority: 2, Points: 5 },
            {ProjectHierarchy: [5]      , Priority: 1, Points: 17},
            {ProjectHierarchy: [1, 2]   , Priority: 1, Points: 3 },
          ]
      
      The ProjectHierarchy field models its hierarchy (tree) as an array containing a
      [materialized path](http://en.wikipedia.org/wiki/Materialized_path). The first fact is "in" Project 3 whose parent is
      Project 2, whose parent is Project 1. The second fact is "in" Project 4 whose parent is Project 2 which still has
      Project 1 as its parent. Project 5 is another root Project like Project 1; and the fourth fact is "in" Project 2.
      So the first fact will roll-up the tree and be aggregated against [1], and [1, 2] as well as [1, 2, 3]. Root Project 1
      will get the data from all but the third fact which will get aggregated against root Project 5.
      
      We specify the ProjectHierarchy field as a dimension of type 'hierarchy' and the Priorty field as a simple value dimension.
      
          dimensions = [
            {field: "ProjectHierarchy", type: 'hierarchy'},
            {field: "Priority"}
          ]
      
      This will create a 2D "cube" where each unique value for ProjectHierarchy and Priority defines a different cell.
      Note, this happens to be a 2D "cube" (more commonly referred to as a [pivot table](http://en.wikipedia.org/wiki/Pivot_Table)),
      but you can also have a 1D cube (a simple group-by), a 3D cube, or even an n-dimensional hypercube where n is greater than 3.
      
      You can specify any number of metrics to be calculated for each cell in the cube.
      
          metrics = [
            {field: "Points", f: "sum", as: "Scope"}
          ]
      
      You can use any of the aggregation functions found in Lumenize.functions except `count`. The count metric is
      automatically tracked for each cell. The `as` specification is optional unless you provide a custom function. If missing,
      it will build the name of the resulting metric from the field name and the function. So without the `as: "Scope"` the
      second metric in the example above would have been named "Points_sum".
      
      You can also use custom functions in the form of `f(values) -> return <some function of values>`.
      
      Next, we build the config parameter from our dimension and metrics specifications.
      
          config = {dimensions, metrics}
      
      Hierarchy dimensions automatically roll up but you can also tell it to keep all totals by setting config.keepTotals to
      true. The totals are then kept in the cells where one or more of the dimension values are set to `null`. Note, you
      can also set keepTotals for individual dimension and should probably use that if you have more than a few dimensions
      but we're going to set it globally here:
      
          config.keepTotals = true
      
      Now, let's create the cube.
      
          {OLAPCube} = require('../')
          cube = new OLAPCube(config, facts)
      
      `getCell()` allows you to extract a single cell. The "total" cell for all facts where Priority = 1 can be found as follows:
      
          console.log(cube.getCell({Priority: 1}))
           * { ProjectHierarchy: null, Priority: 1, _count: 3, Scope: 30 }
      
      Notice how the ProjectHierarchy field value is `null`. This is because it is a total cell for Priority dimension
      for all ProjectHierarchy values. Think of `null` values in this context as wildcards.
      
      Similarly, we can get the total for all descendants of ProjectHierarchy = [1] regarless of Priority as follows:
      
          console.log(cube.getCell({ProjectHierarchy: [1]}))
           * { ProjectHierarchy: [ 1 ], Priority: null, _count: 3, Scope: 18 }
      
      `getCell()` uses the cellIndex so it's very efficient. Using `getCell()` and `getDimensionValues()`, you can iterate
      over a slice of the OLAPCube. It is usually preferable to access the cells in place like this rather than the
      traditional OLAP approach of extracting a slice for processing. However, there is a `slice()` method for extracting
      a 2D slice.
      
          rowValues = cube.getDimensionValues('ProjectHierarchy')
          columnValues = cube.getDimensionValues('Priority')
          s = OLAPCube._padToWidth('', 7) + ' | '
          s += ((OLAPCube._padToWidth(JSON.stringify(c), 7) for c in columnValues).join(' | '))
          s += ' | '
          console.log(s)
          for r in rowValues
            s = OLAPCube._padToWidth(JSON.stringify(r), 7) + ' | '
            for c in columnValues
              cell = cube.getCell({ProjectHierarchy: r, Priority: c})
              if cell?
                cellString = JSON.stringify(cell._count)
              else
                cellString = ''
              s += OLAPCube._padToWidth(cellString, 7) + ' | '
            console.log(s)
           *         |    null |       1 |       2 |
           *    null |       4 |       3 |       1 |
           *     [1] |       3 |       2 |       1 |
           *   [1,2] |       3 |       2 |       1 |
           * [1,2,3] |       1 |       1 |         |
           * [1,2,4] |       1 |         |       1 |
           *     [5] |       1 |       1 |         |
      
      Or you can just call `toString()` method which extracts a 2D slice for tabular display. Both approachs will work on
      cubes of any number of dimensions two or greater. The manual example above extracted the `count` metric. We'll tell
      the example below to extract the `Scope` metric.
      
          console.log(cube.toString('ProjectHierarchy', 'Priority', 'Scope'))
           * |        || Total |     1     2|
           * |==============================|
           * |Total   ||    35 |    30     5|
           * |------------------------------|
           * |[1]     ||    18 |    13     5|
           * |[1,2]   ||    18 |    13     5|
           * |[1,2,3] ||    10 |    10      |
           * |[1,2,4] ||     5 |           5|
           * |[5]     ||    17 |    17      |
      
      ## Dimension types ##
      
      The following dimension types are supported:
      
      1. Single value
         * Number
         * String
         * Does not work:
           * Boolean - known to fail
           * Object - may sorta work but sort-order at least is not obvious
           * Date - not tested but may actually work
      2. Arrays as materialized path for hierarchical (tree) data
      3. Non-hierarchical Arrays ("tags")
      
      There is no need to tell the OLAPCube what type to use with the exception of #2. In that case, add `type: 'hierarchy'`
      to the dimensions row like this:
      
          dimensions = [
            {field: 'hierarchicalDimensionField', type: 'hierarchy'} #, ...
          ]
      
      ## Hierarchical (tree) data ##
      
      This OLAP Cube implementation assumes your hierarchies (trees) are modeled as a
      [materialized path](http://en.wikipedia.org/wiki/Materialized_path) array. This approach is commonly used with NoSQL databases like
      [CouchDB](http://probablyprogramming.com/2008/07/04/storing-hierarchical-data-in-couchdb) and
      [MongoDB (combining materialized path and array of ancestors)](http://docs.mongodb.org/manual/tutorial/model-tree-structures/)
      and even SQL databases supporting array types like [Postgres](http://justcramer.com/2012/04/08/using-arrays-as-materialized-paths-in-postgres/).
      
      This approach differs from the traditional OLAP/MDX fixed/named level hierarchy approach. In that approach, you assume
      that the number of levels in the hierarchy are fixed. Also, each level in the hierarchy is either represented by a different
      column (clothing example --> level 0: SEX column - mens vs womens; level 1: TYPE column - pants vs shorts vs shirts; etc.) or
      predetermined ranges of values in a single field (date example --> level 0: year; level 1: quarter; level 2: month; etc.)
      
      However, the approach used by this OLAPCube implementaion is the more general case, because it can easily simulate
      fixed/named level hierachies whereas the reverse is not true. In the clothing example above, you would simply key
      your dimension off of a derived field that was a combination of the SEX and TYPE columns (e.g. ['mens', 'pants'])
      
      ## Date/Time hierarchies ##
      
      Lumenize is designed to work well with the tzTime library. Here is an example of taking a bunch of ISOString data
      and doing timezone precise hierarchical roll up based upon the date segments (year, month).
      
          data = [
            {date: '2011-12-31T12:34:56.789Z', value: 10},
            {date: '2012-01-05T12:34:56.789Z', value: 20},
            {date: '2012-01-15T12:34:56.789Z', value: 30},
            {date: '2012-02-01T00:00:01.000Z', value: 40},
            {date: '2012-02-15T12:34:56.789Z', value: 50},
          ]
      
          {Time} = require('../')
      
          config =
            deriveFieldsOnInput: [{
              field: 'dateSegments',
              f: (row) ->
                return new Time(row.date, Time.MONTH, 'America/New_York').getSegmentsAsArray()
            }]
            metrics: [{field: 'value', f: 'sum'}]
            dimensions: [{field: 'dateSegments', type: 'hierarchy'}]
      
          cube = new OLAPCube(config, data)
          console.log(cube.toString(undefined, undefined, 'value_sum'))
           * | dateSegments | value_sum |
           * |==========================|
           * | [2011]       |        10 |
           * | [2011,12]    |        10 |
           * | [2012]       |       140 |
           * | [2012,1]     |        90 |
           * | [2012,2]     |        50 |
      
      Notice how '2012-02-01T00:00:01.000Z' got bucketed in January because the calculation was done in timezone
      'America/New_York'.
      
      ## Non-hierarchical Array fields ##
      
      If you don't specify type: 'hierarchy' and the OLAPCube sees a field whose value is an Array in a dimension field, the
      data in that fact would get aggregated against each element in the Array. So a non-hierarchical Array field like
      ['x', 'y', 'z'] would get aggregated against 'x', 'y', and 'z' rather than ['x'], ['x', 'y'], and ['x','y','z]. This
      functionality is useful for  accomplishing analytics on tags, but it can be used in other powerful ways. For instance
      let's say you have a list of events:
      
          events = [
            {name: 'Renaissance Festival', activeMonths: ['September', 'October']},
            {name: 'Concert Series', activeMonths: ['July', 'August', 'September']},
            {name: 'Fall Festival', activeMonths: ['September']}
          ]
      
      You could figure out the number of events active in each month by specifying "activeMonths" as a dimension.
      Lumenize.TimeInStateCalculator (and other calculators in Lumenize) use this technique.
       */
      function OLAPCube(userConfig, facts) {
        var d, j, key, l, len1, len2, len3, len4, m, o, q, ref, ref1, ref2, ref3, ref4, requiredFieldsObject, value;
        this.userConfig = userConfig;

        /*
        @constructor
        @param {Object} config See Config options for details. DO NOT change the config settings after the OLAP class is instantiated.
        @param {Object[]} [facts] Optional parameter allowing the population of the OLAPCube with an intitial set of facts
          upon instantiation. Use addFacts() to add facts after instantiation.
        @cfg {Object[]} [dimensions] Array which specifies the fields to use as dimension fields. If the field contains a
          hierarchy array, say so in the row, (e.g. `{field: 'SomeFieldName', type: 'hierarchy'}`). Any array values that it
          finds in the supplied facts will be assumed to be tags rather than a hierarchy specification unless `type: 'hierarchy'`
          is specified.
        
          For example, let's say you have a set of facts that look like this:
        
            fact = {
              dimensionField: 'a',
              hierarchicalDimensionField: ['1','2','3'],
              tagDimensionField: ['x', 'y', 'z'],
              valueField: 10
            }
        
          Then a set of dimensions like this makes sense.
        
            config.dimensions = [
              {field: 'dimensionField'},
              {field: 'hierarchicalDimensionField', type: 'hierarchy'},
              {field: 'tagDimensionField', keepTotals: true}
            ]
        
          Notice how a keepTotals can be set for an individual dimension. This is preferable to setting it for the entire
          cube in cases where you don't want totals in all dimensions.
        
          If no dimension config is provided, then you must use syntactic sugar like groupBy.
        
        @cfg {String} [groupBy] Syntactic sugar for single-dimension/single-metric usage.
        @cfg {String} [f] Syntactic sugar for single-dimension/single-metric usage. If provided, you must also provide
          a `groupBy` config. If you provided a `groupBy` but no `f` or `field`, then the default `count` metric will be used.
        @cfg {String} [field] Syntactic sugar for single-dimension/single-metric usage. If provided, you must also provide
          a `groupBy` config. If you provided a `groupBy` but no `f` or `field`, then the default `count` metric will be used.
        
        @cfg {Object[]} [metrics=[]] Array which specifies the metrics to calculate for each cell in the cube.
        
          Example:
        
            config = {}
            config.metrics = [
              {field: 'field3'},                                      # defaults to metrics: ['sum']
              {field: 'field4', metrics: [
                {f: 'sum'},                                           # will add a metric named field4_sum
                {as: 'median4', f: 'p50'},                            # renamed p50 to median4 from default of field4_p50
                {as: 'myCount', f: (values) -> return values.length}  # user-supplied function
              ]}
            ]
        
          If you specify a field without any metrics, it will assume you want the sum but it will not automatically
          add the sum metric to fields with a metrics specification. User-supplied aggregation functions are also supported as
          shown in the 'myCount' metric above.
        
          Note, if the metric has dependencies (e.g. average depends upon count and sum) it will automatically add those to
          your metric definition. If you've already added a dependency but put it under a different "as", it's not smart
          enough to sense that and it will add it again. Either live with the slight inefficiency and duplication or leave
          dependency metrics named their default by not providing an "as" field.
        
        @cfg {Boolean} [keepTotals=false] Setting this will add an additional total row (indicated with field: null) along
          all dimensions. This setting can have an impact on the memory usage and performance of the OLAPCube so
          if things are tight, only use it if you really need it. If you don't need it for all dimension, you can specify
          keepTotals for individual dimensions.
        @cfg {Boolean} [keepFacts=false] Setting this will cause the OLAPCube to keep track of the facts that contributed to
          the metrics for each cell by adding an automatic 'facts' metric. Note, facts are restored after deserialization
          as you would expect, but they are no longer tied to the original facts. This feature, especially after a restore
          can eat up memory.
        @cfg {Object[]} [deriveFieldsOnInput] An Array of Maps in the form `{field:'myField', f:(fact)->...}`
        @cfg {Object[]} [deriveFieldsOnOutput] same format as deriveFieldsOnInput, except the callback is in the form `f(row)`
          This is only called for dirty rows that were effected by the latest round of addFacts. It's more efficient to calculate things
          like standard deviation and percentile coverage here than in config.metrics. You just have to remember to include the dependencies
          in config.metrics. Standard deviation depends upon `sum` and `sumSquares`. Percentile coverage depends upon `values`.
          In fact, if you are going to capture values anyway, all of the functions are most efficiently calculated here.
          Maybe some day, I'll write the code to analyze your metrics and move them out to here if it improves efficiency.
         */
        this.config = utils.clone(this.userConfig);
        this.cells = [];
        this.cellIndex = {};
        this.currentValues = {};
        if (this.config.groupBy != null) {
          this.config.dimensions = [
            {
              field: this.config.groupBy
            }
          ];
          if ((this.config.f != null) && (this.config.field != null)) {
            this.config.metrics = [
              {
                field: this.config.field,
                f: this.config.f
              }
            ];
          }
        }
        utils.assert(this.config.dimensions != null, 'Must provide config.dimensions.');
        if (this.config.metrics == null) {
          this.config.metrics = [];
        }
        this._dimensionValues = {};
        ref = this.config.dimensions;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          d = ref[j];
          this._dimensionValues[d.field] = {};
        }
        if (!this.config.keepTotals) {
          this.config.keepTotals = false;
        }
        if (!this.config.keepFacts) {
          this.config.keepFacts = false;
        }
        ref1 = this.config.dimensions;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          d = ref1[l];
          if (this.config.keepTotals || d.keepTotals) {
            d.keepTotals = true;
          } else {
            d.keepTotals = false;
          }
        }
        functions.expandMetrics(this.config.metrics, true, true);
        requiredFieldsObject = {};
        ref2 = this.config.metrics;
        for (o = 0, len3 = ref2.length; o < len3; o++) {
          m = ref2[o];
          if (((ref3 = m.field) != null ? ref3.length : void 0) > 0) {
            requiredFieldsObject[m.field] = null;
          }
        }
        this.requiredMetricsFields = (function() {
          var results;
          results = [];
          for (key in requiredFieldsObject) {
            value = requiredFieldsObject[key];
            results.push(key);
          }
          return results;
        })();
        requiredFieldsObject = {};
        ref4 = this.config.dimensions;
        for (q = 0, len4 = ref4.length; q < len4; q++) {
          d = ref4[q];
          requiredFieldsObject[d.field] = null;
        }
        this.requiredDimensionFields = (function() {
          var results;
          results = [];
          for (key in requiredFieldsObject) {
            value = requiredFieldsObject[key];
            results.push(key);
          }
          return results;
        })();
        this.summaryMetrics = {};
        this.addFacts(facts);
      }

      OLAPCube._possibilities = function(key, type, keepTotals) {
        var a, len;
        switch (utils.type(key)) {
          case 'array':
            if (keepTotals) {
              a = [null];
            } else {
              a = [];
            }
            if (type === 'hierarchy') {
              len = key.length;
              while (len > 0) {
                a.push(key.slice(0, len));
                len--;
              }
            } else {
              if (keepTotals) {
                a = [null].concat(key);
              } else {
                a = key;
              }
            }
            return a;
          case 'string':
          case 'number':
            if (keepTotals) {
              return [null, key];
            } else {
              return [key];
            }
        }
      };

      OLAPCube._decrement = function(a, rollover) {
        var i;
        i = a.length - 1;
        a[i]--;
        while (a[i] < 0) {
          a[i] = rollover[i];
          i--;
          if (i < 0) {
            return false;
          } else {
            a[i]--;
          }
        }
        return true;
      };

      OLAPCube.prototype._expandFact = function(fact) {
        var countdownArray, d, index, j, l, len1, len2, len3, len4, m, more, o, out, outRow, p, possibilitiesArray, q, ref, ref1, ref2, ref3, rolloverArray;
        possibilitiesArray = [];
        countdownArray = [];
        rolloverArray = [];
        ref = this.config.dimensions;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          d = ref[j];
          p = OLAPCube._possibilities(fact[d.field], d.type, d.keepTotals);
          possibilitiesArray.push(p);
          countdownArray.push(p.length - 1);
          rolloverArray.push(p.length - 1);
        }
        ref1 = this.config.metrics;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          m = ref1[l];
          this.currentValues[m.field] = [fact[m.field]];
        }
        out = [];
        more = true;
        while (more) {
          outRow = {};
          ref2 = this.config.dimensions;
          for (index = o = 0, len3 = ref2.length; o < len3; index = ++o) {
            d = ref2[index];
            outRow[d.field] = possibilitiesArray[index][countdownArray[index]];
          }
          outRow._count = 1;
          if (this.config.keepFacts) {
            outRow._facts = [fact];
          }
          ref3 = this.config.metrics;
          for (q = 0, len4 = ref3.length; q < len4; q++) {
            m = ref3[q];
            outRow[m.as] = m.f([fact[m.field]], void 0, void 0, outRow, m.field + '_');
          }
          out.push(outRow);
          more = OLAPCube._decrement(countdownArray, rolloverArray);
        }
        return out;
      };

      OLAPCube._extractFilter = function(row, dimensions) {
        var d, j, len1, out;
        out = {};
        for (j = 0, len1 = dimensions.length; j < len1; j++) {
          d = dimensions[j];
          out[d.field] = row[d.field];
        }
        return out;
      };

      OLAPCube.prototype._mergeExpandedFactArray = function(expandedFactArray) {
        var d, er, fieldValue, filterString, j, l, len1, len2, len3, m, o, olapRow, ref, ref1, results;
        results = [];
        for (j = 0, len1 = expandedFactArray.length; j < len1; j++) {
          er = expandedFactArray[j];
          ref = this.config.dimensions;
          for (l = 0, len2 = ref.length; l < len2; l++) {
            d = ref[l];
            fieldValue = er[d.field];
            this._dimensionValues[d.field][JSON.stringify(fieldValue)] = fieldValue;
          }
          filterString = JSON.stringify(OLAPCube._extractFilter(er, this.config.dimensions));
          olapRow = this.cellIndex[filterString];
          if (olapRow != null) {
            ref1 = this.config.metrics;
            for (o = 0, len3 = ref1.length; o < len3; o++) {
              m = ref1[o];
              olapRow[m.as] = m.f(olapRow[m.field + '_values'], olapRow[m.as], this.currentValues[m.field], olapRow, m.field + '_');
            }
          } else {
            olapRow = er;
            this.cellIndex[filterString] = olapRow;
            this.cells.push(olapRow);
          }
          results.push(this.dirtyRows[filterString] = olapRow);
        }
        return results;
      };

      OLAPCube.prototype.addFacts = function(facts) {

        /*
        @method addFacts
          Adds facts to the OLAPCube.
        
        @chainable
        @param {Object[]} facts An Array of facts to be aggregated into OLAPCube. Each fact is a Map where the keys are the field names
          and the values are the field values (e.g. `{field1: 'a', field2: 5}`).
         */
        var d, dirtyRow, expandedFactArray, fact, fieldName, filterString, j, l, len1, len2, len3, len4, o, q, ref, ref1, ref2;
        this.dirtyRows = {};
        if (utils.type(facts) === 'array') {
          if (facts.length <= 0) {
            return;
          }
        } else {
          if (facts != null) {
            facts = [facts];
          } else {
            return;
          }
        }
        if (this.config.deriveFieldsOnInput) {
          for (j = 0, len1 = facts.length; j < len1; j++) {
            fact = facts[j];
            ref = this.config.deriveFieldsOnInput;
            for (l = 0, len2 = ref.length; l < len2; l++) {
              d = ref[l];
              if (d.as != null) {
                fieldName = d.as;
              } else {
                fieldName = d.field;
              }
              fact[fieldName] = d.f(fact);
            }
          }
        }
        for (o = 0, len3 = facts.length; o < len3; o++) {
          fact = facts[o];
          this.addMissingFields(fact);
          this.currentValues = {};
          expandedFactArray = this._expandFact(fact);
          this._mergeExpandedFactArray(expandedFactArray);
        }
        if (this.config.deriveFieldsOnOutput != null) {
          ref1 = this.dirtyRows;
          for (filterString in ref1) {
            dirtyRow = ref1[filterString];
            ref2 = this.config.deriveFieldsOnOutput;
            for (q = 0, len4 = ref2.length; q < len4; q++) {
              d = ref2[q];
              if (d.as != null) {
                fieldName = d.as;
              } else {
                fieldName = d.field;
              }
              dirtyRow[fieldName] = d.f(dirtyRow);
            }
          }
        }
        this.dirtyRows = {};
        return this;
      };

      OLAPCube.prototype.addMissingFields = function(fact) {
        var field, j, l, len1, len2, ref, ref1;
        ref = this.requiredMetricsFields;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          field = ref[j];
          if (fact[field] === void 0) {
            fact[field] = null;
          }
        }
        ref1 = this.requiredDimensionFields;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          field = ref1[l];
          if (fact[field] == null) {
            fact[field] = '<missing>';
          }
        }
        return fact;
      };

      OLAPCube.prototype.getCells = function(filterObject) {

        /*
        @method getCells
          Returns a subset of the cells that match the supplied filter. You can perform slice and dice operations using
          this. If you have criteria for all of the dimensions, you are better off using `getCell()`. Most times, it's
          better to iterate over the unique values for the dimensions of interest using `getCell()` in place of slice or
          dice operations. However, there is a `slice()` method for extracting a 2D slice
        @param {Object} [filterObject] Specifies the constraints that the returned cells must match in the form of
          `{field1: value1, field2: value2}`. If this parameter is missing, the internal cells array is returned.
        @return {Object[]} Returns the cells that match the supplied filter
         */
        var c, j, len1, output, ref;
        if (filterObject == null) {
          return this.cells;
        }
        output = [];
        ref = this.cells;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          c = ref[j];
          if (utils.filterMatch(filterObject, c)) {
            output.push(c);
          }
        }
        return output;
      };

      OLAPCube.prototype.getCell = function(filter, defaultValue) {

        /*
        @method getCell
          Returns the single cell matching the supplied filter. Iterating over the unique values for the dimensions of
          interest, you can incrementally retrieve a slice or dice using this method. Since `getCell()` always uses an index,
          in most cases, this is better than using `getCells()` to prefetch a slice or dice.
        @param {Object} [filter={}] Specifies the constraints for the returned cell in the form of `{field1: value1, field2: value2}.
          Any fields that are specified in config.dimensions that are missing from the filter are automatically filled in
          with null. Calling `getCell()` with no parameter or `{}` will return the total of all dimensions (if @config.keepTotals=true).
        @return {Object[]} Returns the cell that match the supplied filter
         */
        var cell, d, foundIt, j, key, l, len1, len2, normalizedFilter, ref, ref1, value;
        if (filter == null) {
          filter = {};
        }
        for (key in filter) {
          value = filter[key];
          foundIt = false;
          ref = this.config.dimensions;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            d = ref[j];
            if (d.field === key) {
              foundIt = true;
            }
          }
          if (!foundIt) {
            throw new Error(key + " is not a dimension for this cube.");
          }
        }
        normalizedFilter = {};
        ref1 = this.config.dimensions;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          d = ref1[l];
          if (filter.hasOwnProperty(d.field)) {
            normalizedFilter[d.field] = filter[d.field];
          } else {
            if (d.keepTotals) {
              normalizedFilter[d.field] = null;
            } else {
              throw new Error('Must set keepTotals to use getCell with a partial filter.');
            }
          }
        }
        cell = this.cellIndex[JSON.stringify(normalizedFilter)];
        if (cell != null) {
          return cell;
        } else {
          return defaultValue;
        }
      };

      OLAPCube.prototype.getDimensionValues = function(field, descending) {
        var values;
        if (descending == null) {
          descending = false;
        }

        /*
        @method getDimensionValues
          Returns the unique values for the specified dimension in sort order.
        @param {String} field The field whose values you want
        @param {Boolean} [descending=false] Set to true if you want them in reverse order
         */
        values = utils.values(this._dimensionValues[field]);
        values.sort(utils.compare);
        if (!descending) {
          values.reverse();
        }
        return values;
      };

      OLAPCube.roundToSignificance = function(value, significance) {
        var multiple;
        if (significance == null) {
          return value;
        }
        multiple = 1 / significance;
        return Math.floor(value * multiple) / multiple;
      };

      OLAPCube.prototype.slice = function(rows, columns, metric, significance) {

        /*
        @method slice
          Extracts a 2D slice of the data. It outputs an array of arrays (JavaScript two-dimensional array) organized as the
          C3 charting library would expect if submitting row-oriented data. Note, the output of this function is very similar
          to the 2D toString() function output except the data is organized as a two-dimensional array instead of newline-separated
          lines and the cells are filled with actual values instead of padded string representations of those values.
        @return {[[]]} An array of arrays with the one row for the header and each row label
        @param {String} [rows=<first dimension>]
        @param {String} [columns=<second dimension>]
        @param {String} [metric='count']
        @param {Number} [significance] The multiple to which you want to round the bucket edges. 1 means whole numbers.
          0.1 means to round to tenths. 0.01 to hundreds. Etc.
         */
        var c, cell, cellValue, columnValues, filter, indexColumn, indexRow, j, l, len1, len2, len3, o, r, rowValues, topRow, values, valuesRow;
        if (rows == null) {
          rows = this.config.dimensions[0].field;
        }
        if (columns == null) {
          columns = this.config.dimensions[1].field;
        }
        rowValues = this.getDimensionValues(rows);
        columnValues = this.getDimensionValues(columns);
        values = [];
        topRow = [];
        topRow.push('x');
        for (indexColumn = j = 0, len1 = columnValues.length; j < len1; indexColumn = ++j) {
          c = columnValues[indexColumn];
          if (c === null) {
            topRow.push('Total');
          } else {
            topRow.push(c);
          }
        }
        values.push(topRow);
        for (indexRow = l = 0, len2 = rowValues.length; l < len2; indexRow = ++l) {
          r = rowValues[indexRow];
          valuesRow = [];
          if (r === null) {
            valuesRow.push('Total');
          } else {
            valuesRow.push(r);
          }
          for (indexColumn = o = 0, len3 = columnValues.length; o < len3; indexColumn = ++o) {
            c = columnValues[indexColumn];
            filter = {};
            filter[rows] = r;
            filter[columns] = c;
            cell = this.getCell(filter);
            if (cell != null) {
              cellValue = OLAPCube.roundToSignificance(cell[metric], significance);
            } else {
              cellValue = null;
            }
            valuesRow.push(cellValue);
          }
          values.push(valuesRow);
        }
        return values;
      };

      OLAPCube._padToWidth = function(s, width, padCharacter, rightPad) {
        var padding;
        if (padCharacter == null) {
          padCharacter = ' ';
        }
        if (rightPad == null) {
          rightPad = false;
        }
        if (s.length > width) {
          return s.substr(0, width);
        }
        padding = new Array(width - s.length + 1).join(padCharacter);
        if (rightPad) {
          return s + padding;
        } else {
          return padding + s;
        }
      };

      OLAPCube.prototype.getStateForSaving = function(meta) {

        /*
        @method getStateForSaving
          Enables saving the state of an OLAPCube.
        @param {Object} [meta] An optional parameter that will be added to the serialized output and added to the meta field
          within the deserialized OLAPCube
        @return {Object} Returns an Ojbect representing the state of the OLAPCube. This Object is suitable for saving to
          to an object store. Use the static method `newFromSavedState()` with this Object as the parameter to reconstitute the OLAPCube.
        
            facts = [
              {ProjectHierarchy: [1, 2, 3], Priority: 1},
              {ProjectHierarchy: [1, 2, 4], Priority: 2},
              {ProjectHierarchy: [5]      , Priority: 1},
              {ProjectHierarchy: [1, 2]   , Priority: 1},
            ]
        
            dimensions = [
              {field: "ProjectHierarchy", type: 'hierarchy'},
              {field: "Priority"}
            ]
        
            config = {dimensions, metrics: []}
            config.keepTotals = true
        
            originalCube = new OLAPCube(config, facts)
        
            dateString = '2012-12-27T12:34:56.789Z'
            savedState = originalCube.getStateForSaving({upToDate: dateString})
            restoredCube = OLAPCube.newFromSavedState(savedState)
        
            newFacts = [
              {ProjectHierarchy: [5], Priority: 3},
              {ProjectHierarchy: [1, 2, 4], Priority: 1}
            ]
            originalCube.addFacts(newFacts)
            restoredCube.addFacts(newFacts)
        
            console.log(restoredCube.toString() == originalCube.toString())
             * true
        
            console.log(restoredCube.meta.upToDate)
             * 2012-12-27T12:34:56.789Z
         */
        var out;
        out = {
          config: this.userConfig,
          cellsAsCSVStyleArray: arrayOfMaps_To_CSVStyleArray(this.cells),
          summaryMetrics: this.summaryMetrics
        };
        if (meta != null) {
          out.meta = meta;
        }
        return out;
      };

      OLAPCube.newFromSavedState = function(p) {

        /*
        @method newFromSavedState
          Deserializes a previously stringified OLAPCube and returns a new OLAPCube.
        
          See `getStateForSaving()` documentation for a detailed example.
        
          Note, if you have specified config.keepFacts = true, the values for the facts will be restored, however, they
          will no longer be references to the original facts. For this reason, it's usually better to include a `values` or
          `uniqueValues` metric on some ID field if you want fact drill-down support to survive a save and restore.
        @static
        @param {String/Object} p A String or Object from a previously saved OLAPCube state
        @return {OLAPCube}
         */
        var c, cube, d, fieldValue, filterString, j, l, len1, len2, len3, o, ref, ref1, ref2;
        if (utils.type(p) === 'string') {
          p = JSON.parse(p);
        }
        cube = new OLAPCube(p.config);
        cube.summaryMetrics = p.summaryMetrics;
        if (p.meta != null) {
          cube.meta = p.meta;
        }
        if (p.cellsAsCSVStyleArray != null) {
          cube.cells = csvStyleArray_To_ArrayOfMaps(p.cellsAsCSVStyleArray);
        } else {
          cube.cells = p.cells;
        }
        cube.cellIndex = {};
        cube._dimensionValues = {};
        ref = cube.config.dimensions;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          d = ref[j];
          cube._dimensionValues[d.field] = {};
        }
        ref1 = cube.cells;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          c = ref1[l];
          filterString = JSON.stringify(OLAPCube._extractFilter(c, cube.config.dimensions));
          cube.cellIndex[filterString] = c;
          ref2 = cube.config.dimensions;
          for (o = 0, len3 = ref2.length; o < len3; o++) {
            d = ref2[o];
            fieldValue = c[d.field];
            cube._dimensionValues[d.field][JSON.stringify(fieldValue)] = fieldValue;
          }
        }
        return cube;
      };

      return OLAPCube;

    })();
    context = getContext();
    collection = context.getCollection();
    if (memo.continuation == null) {
      memo.continuation = null;
    }
    if (memo.savedCube != null) {
      theCube = OLAPCube.newFromSavedState(memo.savedCube);
    } else if (memo.cubeConfig != null) {
      theCube = new OLAPCube(memo.cubeConfig);
    } else {
      throw new Error('cubeConfig or savedCube required');
    }
    memo.stillQueueing = true;
    query = function() {
      var responseOptions;
      setBody();
      if (memo.stillQueueing) {
        responseOptions = {
          continuation: memo.continuation,
          pageSize: 1000
        };
        if (memo.filterQuery != null) {
          return memo.stillQueueing = collection.queryDocuments(collection.getSelfLink(), memo.filterQuery, responseOptions, onReadDocuments);
        } else {
          return memo.stillQueueing = collection.readDocuments(collection.getSelfLink(), responseOptions, onReadDocuments);
        }
      }
    };
    onReadDocuments = function(err, resources, options) {
      if (err != null) {
        throw new Error(JSON.stringify(err));
      }
      theCube.addFacts(resources);
      memo.savedCube = theCube.getStateForSaving();
      memo.example = resources[0];
      if (options.continuation != null) {
        memo.continuation = options.continuation;
        return query();
      } else {
        memo.continuation = null;
        return setBody();
      }
    };
    setBody = function() {
      return getContext().getResponse().setBody(memo);
    };
    query();
    return memo;
  }
