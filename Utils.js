/**
 * Created by Alone on 2017/3/2.
 */
'use strict';
class Utils {
    static sleep(n) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), n);
        });
    }
}
module.exports = Utils;