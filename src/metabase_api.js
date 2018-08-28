module.exports = function(params) {
  var Client = require('node-rest-client').Client;
  var client = new Client();

  var host = params.host;
  var user = params.user;
  var password = params.password;
  var sessionId = params.sessionId;

  function headers() {
    var h = {"Content-Type": "application/json"};
    if (sessionId) h['X-Metabase-Session'] = sessionId;
    return h;
  };

  var def = {

    login: function() {
      var args = {
        data: {
          username: user,
          password: password
        },
        headers: headers(),
        path: {host: host}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/session";
        client.post(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            console.log("Using X-Metabase-Session=" + data.id);
            sessionId = data.id;
            resolve(data);
          }
        });
      });
    },

    getQuestion: function(id) {
      var args = {
        headers: headers(),
        path: {host: host, id: id}
      }
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/card/${id}";
        client.get(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    postQuestion: function(question) {
      var args = {
        data: question,
        headers: headers(),
        path: {host: host}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/card";
        client.post(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    getFields: function(database_id) {
      var args = {
        headers: headers(),
        path: {host: host, id: database_id}
      }
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/database/${id}/fields";
        client.get(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    getCollectionItems: function(id) {
      var args = {
        headers: headers(),
        path: {host: host, id: id}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/collection/${id}/items";
        client.get(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    getDashboard: function(id) {
      var args = {
        headers: headers(),
        path: {host: host, id: id}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/dashboard/${id}";
        client.get(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    postDashboard: function(dashboard) {
      var args = {
        data: dashboard,
        headers: headers(),
        path: {host: host}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/dashboard";
        client.post(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    },

    postDashboardCard: function(id, card) {
      var args = {
        data: card,
        headers: headers(),
        path: {host: host, id: id}
      };
      return new Promise(function(resolve, reject) {
        var path = "https://${host}/api/dashboard/${id}/cards";
        client.post(path, args, function(data, response) {
          if (response.statusCode != 200) {
            reject(response.statusMessage);
          } else {
            resolve(data);
          }
        });
      });
    }

  }

  return def;

}