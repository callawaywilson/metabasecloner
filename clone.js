var argv = require('minimist')(process.argv.slice(2));
var prompt = require('prompt');
var merge = require('merge');
var uuidv1 = require('uuid/v1');

// Gather parameters
var host = (argv['h'] || argv['host'])
if (!host) {
  console.log("Host is required");
  process.exit(1);
}

var user = (argv['u'] || argv['user']);
var sessionId = (argv['s'] || argv['session']);
if (!user && !sessionId) {
  console.log('User or Session is required');
  process.exit(1);
}

// Clone type
var type = (argv['t'] || argv['type'])
if (!(type === 'question') && !(type === 'collection') && !(type === 'dashboard')) {
  console.log("Type must be one of [question, collection, dashboard]");
  process.exit(1);
}

// ID
var id = (argv['i'] || argv['id'])
if (!id) {
  console.log("ID is required");
  process.exit(1);
}

// Collection ID
var targetCollection = (argv['c'] || argv['collection']);


// Target DB
var targetDB = (argv['d'] || argv['database']);
if (!targetDB) {
  console.log("Database ID is required");
  process.exit(1);
}

// Prompt for password
var password = null;
if (!sessionId) {
  prompt.start();
  prompt.get({properties: 
    {password: {hidden: true, message: "Metabase password", required: true}}}, 
  function (err, result) {
    var api = require('./src/metabase_api')({
      host: host,
      user: user,
      password: result.password
    });
    console.log("Connecting to '" + host + "'");

    if (sessionId) {
      doClone(api, {type: type, id: id, targetDB: targetDB});
    } else {
      api.login().then(function() {
        doClone(api, {type: type, id: id, targetDB: targetDB});
      }).catch(console.error);
    }
  });
// Or use supplied session
} else {
  var api = require('./src/metabase_api')({
    host: host,
    sessionId: sessionId
  });
  doClone(api, {type: type, id: id, targetDB: targetDB, 
    targetCollection: targetCollection});
}




function doClone(api, params) {
  console.log("Cloning " + params.type + 
    " id [" + params.id + "] to DB [" + 
    params.targetDB + "] and to collection [" +
    params.targetCollection + "]");
  if (params.type === 'question') {
    cloneQuestion(api, params);
  } else if (params.type === 'collection') {
    cloneCollection(api, params);
  } else if (params.type === 'dashboard') {
    cloneDashboard(api, params);
  }
}

// Copies the questions in the collection to the target collection
// Params:
//  id: Collection to clone
//  targetDB: ID of DB to target
//  targetCollection: ID of collection to copy questions to
async function cloneCollection(api, params) {
  console.log("Cloning collection ID " + params.id);
  try {
    var collectionItems = await api.getCollectionItems(params.id);
    for (var i = 0; i < collectionItems.length; i++) {
      if (collectionItems[i].model === 'card') {
        cloneQuestion(api, {
          id: collectionItems[i].id, 
          targetDB: targetDB, 
          targetCollection: targetCollection
        });
      }
    }
  } catch(e) {
    console.error(e);
  }
}

async function cloneQuestion(api, params) {
  console.log("Cloning question ID " + params.id);
  try {
    var question = await api.getQuestion(params.id);
    // console.log('oldQuestion', JSON.stringify(question));
    var sourceFields = await api.getFields(question.database_id);
    var targetFields = await api.getFields(params.targetDB);

    var newQuestion = questionPropertiesTo(question, sourceFields, targetFields, 
      params.targetDB, params.targetCollection);
    // console.log('newQuestion', newQuestion)
    var result = api.postQuestion(newQuestion);
  } catch(e) {
    console.error("Error cloning question ID " + params.id, e);
  }
}

// Clone a dashboard, creating a new one from the structure of the old one,
// and adds the cards with the same names from the target dashboard.  The questions
// with the same names must be present in the source and target databases.
// params:
//  id: Dashboard to clone
//  targetCollection: ID to put new dashboard in
async function cloneDashboard(api, params) {
  console.log("Cloning dashboard ID " + params.id);
  try {

    // get source dashboard
    var dashboard = await api.getDashboard(params.id);
    var newDashboard = {
      name: dashboard.name,
      description: dashboard.description,
      parameters: dashboard.parameters,
      collection_id: params.targetCollection
    }
    var savedDashboard = await api.postDashboard(newDashboard);

    // Find questions in target DB with same names, create dashboard cards
    var dbItems = await api.getCollectionItems(params.targetCollection); 
    var newCards = [];
    for (var i = 0; i < dashboard.ordered_cards.length; i++) {
      var cardDef = dashboard.ordered_cards[i];
      var card = cardDef.card;
      var parameter_mappings = dashboard.ordered_cards[i].parameter_mappings;
      var targetCard = findCard(card.name, dbItems);
      if (!targetCard) {
        throw "Unable to find target card " + card.name;
      }
      for (var p = 0; p < parameter_mappings.length; p++) {
        parameter_mappings[p].card_id = targetCard.id;
      }
      newCards.push({
        id: savedDashboard.id,
        cardId: targetCard.id,
        sizeX: cardDef.sizeX,
        sizeY: cardDef.sizeY,
        row: cardDef.row,
        col: cardDef.col,
        series: cardDef.series,
        parameter_mappings: parameter_mappings
      });
    }
   
    // and put cards to dashboard
    for (var c = 0; c < newCards.length; c++) {
      var cardToSave = newCards[c];
      var savedCard = await api.postDashboardCard(savedDashboard.id, cardToSave);
      console.log("Saved card " + savedCard.id);
    }
  } catch(e) {
    console.error(e);
  }
}


function questionPropertiesTo(original, source_fields, target_fields, 
    database_id, collection_id) {

  var dataset_query = merge(original.dataset_query, {database: database_id});
  if (dataset_query.type === 'native') {
    dataset_query.native['template-tags'] = toTargetTemplateTags(
      dataset_query.native['template-tags'], source_fields, target_fields);
  }
  return {
    name: original.name,
    query_type: original.query_type,
    description: original.description,
    database_id: database_id,
    collection_id: collection_id,
    dataset_query: dataset_query,
    display: original.display,
    visualization_settings: original.visualization_settings
  }
}

function toTargetTemplateTags(template_tags, old_fields, target_fields) {
  var target = {};
  for (var key in template_tags) {
    target[key] = merge(template_tags[key], {
      id: uuidv1()
    });
    if (target[key].dimension) {
      // Find field ID in old fields
      var fieldId = target[key].dimension[1];
      var fieldName = null;
      var tableName = null;
      for (var i = 0; i < old_fields.length; i++) {
        if (fieldId == old_fields[i].id) {
          fieldName = old_fields[i].name;
          tableName = old_fields[i].table_name;
          break;
        }
      }
      if (!fieldName || !tableName) throw "Can't find field ID in source";

      var targetFieldId = null;
      for (var i = 0; i < target_fields.length; i++) {
        if (target_fields[i].name === fieldName && 
            target_fields[i].table_name === tableName) {
          targetFieldId = target_fields[i].id;
          break;
        }
      }
      if (!targetFieldId) throw "Can't find target field for " + fieldName;

      target[key].dimension = ["field-id", targetFieldId];
    }
  }
  return target;
}


function findCard(name, items) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].model === 'card' && items[i].name === name) {
      return items[i];
    }
  }
  return null;
}


