function createReqRes({ method = "GET", body = null } = {}) {
  const req = { method, body };

  const res = {
    _status: 200,
    _json: null,
    _body: null,
    _headers: {},
    status(code) {
      this._status = code;
      return this;
    },
    setHeader(name, value) {
      this._headers[name.toLowerCase()] = value;
    },
    json(payload) {
      this._json = payload;
      return this;
    },
    send(payload) {
      this._body = payload;
      return this;
    },
    end(payload) {
      this._body = payload ?? this._body;
      return this;
    },
  };

  return { req, res };
}

module.exports = { createReqRes };
