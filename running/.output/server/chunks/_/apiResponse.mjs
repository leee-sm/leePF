function ok(data) {
  return { success: true, data };
}
function fail(code, message) {
  return { success: false, error: { code, message } };
}

export { fail as f, ok as o };
//# sourceMappingURL=apiResponse.mjs.map
