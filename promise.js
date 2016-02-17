(function() {
    var PENDING = 'pending';
    var RESOLVED = 'resolved';
    var REJECTED = 'rejected';

    function isFunction(fn) {
        return fn && typeof fn === 'function';
    }

    function isThenable(obj) {
        return obj.then && isFunction(obj.then);
    }


    var Promise = function (resolver) {
        this._status = PENDING;
        this._resolve;
        this._reject;
        this._value;
        this._reason;

        if(typeof resolver !== 'function') {
            throw new Error('only accept function');
        }

        if(!(this instanceof Promise)) return new Promise(resolver);

        var promise = this;

        function resolve(value) {
            promise._status = RESOLVED;
            promise._value = value;

            if(isFunction(promise._resolve)) {
                promise._resolve(value);

                //防止内存泄露
                delete promise._resolve;
            }
        }

        function reject(reason) {
            promise._status = REJECTED;
            promise._reason = reason;

            if(isFunction(promise._reject)) {
                promise._reject(reason);

                //防止内存泄露
                delete promise._reject;
            }
        }

        //立即执行
        resolver(resolve, reject);
    };

    Promise.prototype.isRejected = function () {
        return this._status === REJECTED;
    };

    Promise.prototype.isResolved = function () {
        return this._status === RESOLVED;
    };

    Promise.prototype.isPending = function () {
        return this._status === PENDING;
    };

    Promise.prototype.then = function (onResolve, onReject) {
        var promise = this;

        return Promise(function (resolve, reject) {

            function callback(value) {
                var ret;

                if(isFunction(onResolve)) {
                    try{
                        ret = onResolve(value);
                    } catch(e) {
                        errback(e);
                        if(console.error) {
                            console.error('promise resolve error');
                            console.error(e);
                        }
                    }
                } else {
                    ret = onResolve || value;
                }

                if(isThenable(ret)) {
                    ret.then(resolve, reject);
                } else {
                    resolve(ret);
                }
            }

            function errback(reason) {
                var ret = isFunction(onReject) ? onReject(reason) : onReject || value;

                if(isThenable(ret)) {
                    ret.then(resolve, reject);
                } else {
                    reject(reason);
                }
            }

            if(promise._status === PENDING) {
                promise._resolve = callback;
                promise._reject = errback;
            } else if(promise._status === RESOLVED) {
                callback(promise._value);
            } else if(promise._status === REJECTED) {
                errback(promise._reason);
            }
        });
    };

    window.Promise = Promise;

})();