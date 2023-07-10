"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashboardResolver = {
    Query: {
        getBarChart: (_root, { _id }, req) => {
            return "Dashboard query write in a separagte file for make easy find later";
        }
    }
};
exports.default = dashboardResolver;
