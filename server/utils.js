exports.debug = function(mes) {
	console.log("[DEBUG]" + new Date().toLocaleString() + ": " + mes);
}
exports.error = function(mes) {
	console.log("[EEROR]" + new Date().toLocaleString() + ": " + mes);
}
exports.getKey = function(schema, key, column) {
	return schema + ":" + key + ":" + column;
}