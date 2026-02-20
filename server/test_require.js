const fs = require('fs');

const routes = [
    './src/routes/authRoutes',
    './src/routes/cartRoutes',
    './src/routes/productRoutes',
    './src/routes/orderRoutes',
    './src/routes/reviewRoutes',
    './src/routes/wishlistRoutes',
    './src/routes/couponRoutes',
    './src/routes/stockAlertRoutes',
    './src/routes/userRoutes',
    './src/routes/settingsRoutes',
    './src/routes/heroSlideRoutes',
    './src/routes/categoryRoutes',
    './src/routes/stockRoutes',
    './src/routes/auditRoutes'
];

let log = '';

routes.forEach(route => {
    try {
        const r = require(route);
        log += `Success: ${route} (Type: ${typeof r})\n`;
        if (typeof r !== 'function') {
            log += `WARNING: ${route} does not export a function/router. It exports: ${typeof r}\n`;
        }
    } catch (e) {
        log += `FAIL: ${route} - ${e.message}\n${e.stack}\n`;
    }
});

fs.writeFileSync('error_routes.txt', log);
console.log('Done testing routes.');
