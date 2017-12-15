// ----------------------------------------
// Environment

/**
 * Sets or possibly creates the current document and returns it.
 * If the param doc is not given the current document gets set to the active document
 * in the application. If no document at all is open, a new document gets created.
 *
 * @cat Document
 * @method doc
 * @param  {Document} [doc] The document to set the current document to.
 * @return {Document} The current document instance.
 */
pub.doc = function(doc) {
  if (doc instanceof Document) {
    setCurrDoc(doc);
  }
  return currentDoc();
};

/**
 * Sets the size of the current document, if arguments are given.
 * If only one argument is given, both the width and the height are set to this value.
 * Alternatively, a string can be given as the first argument to apply an existing page size preset ("A4", "Letter" etc.).
 * In this case, either b.PORTRAIT or b.LANDSCAPE can be used as a second argument to determine the orientation of the page.
 * If no argument is given, an object containing the current document's width and height is returned.
 *
 * @cat Document
 * @method size
 * @param  {Number|String} [widthOrPageSize] The desired width of the current document or the name of a page size preset.
 * @param  {Number|String} [heightOrOrientation] The desired height of the current document. If not provided the width will be used as the height. If the first argument is a page size preset, the second argument can be used to set the orientation.
 * @return {Object} Object containing the current <code>width</code> and <code>height</code> of the document.
 *
 * @example <caption>Sets the document size to 70 x 100 units</caption>
 * b.size(70, 100);
 *
 * @example <caption>Sets the document size to 70 x 70</caption>
 * b.size(70);
 *
 * @example <caption>Sets the document size to A4, keeps the current orientation in place</caption>
 * b.size("A4");
 *
 * @example <caption>Sets the document size to A4, set the orientation to landscape</caption>
 * b.size("A4", b.LANDSCAPE);
 */
pub.size = function(widthOrPageSize, heightOrOrientation) {
  if(app.documents.length === 0) {
    // there are no documents
    warning("b.size()", "You have no open document.");
    return;
  }
  if (arguments.length === 0) {
    // no arguments given
    // return the current values
    return {width: pub.width, height: pub.height};
  }

  var doc = currentDoc();

  if(typeof widthOrPageSize === "string") {

    try {
      doc.documentPreferences.pageSize = widthOrPageSize;
    } catch (e) {
      b.error("b.size(), could not find a page size preset named \"" + widthOrPageSize + "\".");
    }
    if(heightOrOrientation === b.PORTRAIT || heightOrOrientation === b.LANDSCAPE) {
      doc.documentPreferences.pageOrientation = heightOrOrientation;
    }
    pub.height = doc.documentPreferences.pageHeight;
    pub.width = doc.documentPreferences.pageWidth;
    return {width: pub.width, height: pub.height};
  } else if(arguments.length === 1) {
    // only one argument set the first to the secound
    heightOrOrientation = widthOrPageSize;
  }
  // set the document's pageHeight and pageWidth
  doc.properties = {
    documentPreferences: {
      pageHeight: heightOrOrientation,
      pageWidth: widthOrPageSize
    }
  };
  // set height and width
  pub.height = heightOrOrientation;
  pub.width = widthOrPageSize;

  return {width: pub.width, height: pub.height};

};

/**
 * Closes the current document.
 *
 * @cat Document
 * @method close
 * @param  {Object|Boolean} [saveOptions] The Indesign SaveOptions constant or either true for triggering saving before closing or false for closing without saving.
 * @param  {File} [file] The indesign file instance to save the document to.
 */
pub.close = function(saveOptions, file) {
  var doc = currentDoc();
  if (doc) {
    if(typeof saveOptions === "boolean" && saveOptions === false) {
      saveOptions = SaveOptions.no;
    }
    if(typeof saveOptions === "boolean" && saveOptions === true) {
      saveOptions = SaveOptions.yes;
    }
    doc.close(saveOptions, file);
    resetCurrDoc();
  }
};

/**
 * @description Reverts the document to its last saved state. If the current document is not saved yet, this function will close the document without saving it and reopen a fresh document so as to "revert" the unsaved document. This function is helpful during development stage to start from a new or default document each time the script is run.
 *
 * @cat Document
 * @method revert
 * @return {Document} The reverted document.
 */
pub.revert = function() {

  if(currDoc.saved && currDoc.modified) {
    var currFile = currDoc.fullName;
    currDoc.close(SaveOptions.NO);
    app.open(File(currFile));
    resetCurrDoc();
  } else if(!currDoc.saved) {
    currDoc.close(SaveOptions.NO);
    resetCurrDoc();
    app.documents.add();
    currentDoc();
  }

  return currDoc;
};

/**
 * Use this to set the dimensions of the canvas. Choose between b.PAGE (default), b.MARGIN, b.BLEED resp. b.FACING_PAGES, b.FACING_MARGINS and b.FACING_BLEEDS for book setups with facing page. Please note: Setups with more than two facing pages are not yet supported.
 * Please note that you will loose your current MatrixTransformation. You should set the canvasMode before you attempt to use b.translate(), b.rotate() and b.scale();
 * @cat Document
 * @subcat Page
 * @method canvasMode
 * @param  {String} mode The canvas mode to set.
 * @return {String} The current canvas mode.
 */
pub.canvasMode = function (m) {
  if(arguments.length === 0) {
    return currCanvasMode;
  } else if (typeof m === "string") {
    if ((m === b.FACING_PAGES || m === b.FACING_MARGINS || m === b.FACING_BLEEDS) && !b.doc().documentPreferences.facingPages) {
      b.error("b.canvasMode(), cannot set a facing pages mode to a single page document");
    }
    currCanvasMode = m;
    updatePublicPageSizeVars();
    return currCanvasMode;
  } else {
    error("b.canvasMode(), there is a problem setting the canvasMode. Please check the reference for details.");
  }
};


/**
 * Returns the current horizontal and vertical pasteboard margins and sets them if both arguements are given.
 *
 * @cat Document
 * @subcat Page
 * @method pasteboard
 * @param  {Number} h The desired horizontal pasteboard margin.
 * @param  {Number} v The desired vertical pasteboard margin.
 * @return {Array} The current horizontal, vertical pasteboard margins.
 */
pub.pasteboard = function (h, v) {
  if(arguments.length == 0) {
    return currDoc.pasteboardPreferences.pasteboardMargins;
  } else if(arguments.length == 1) {
    error("b.pasteboard() requires both a horizontal and vertical value. Please check the reference for details.");
  }else if (typeof h === "number" && typeof v === "number") {
    currDoc.pasteboardPreferences.pasteboardMargins = [h, v];
    return currDoc.pasteboardPreferences.pasteboardMargins;
  }else {
    error("b.pasteboard(), there is a problem setting the pasteboard. Please check the reference for details.");
  }
};

/**
 * Returns the current page and sets it if argument page is given. Numbering starts with 1.
 *
 * @cat Document
 * @subcat Page
 * @method page
 * @param  {Page|Number|PageItem} [page] The page object or page number to set the current page to. If you pass a PageItem the current page will be set to it's containing page.
 * @return {Page} The current page instance.
 */
pub.page = function(page) {
  if (page instanceof Page) {
    currPage = page;
  } else if (typeof page !== "undefined" && page.hasOwnProperty("parentPage")) {
    currPage = page.parentPage; // page is actually a PageItem
  } else if (typeof page === "number") {
    if(page < 1) {
      p = 0;
    } else {
      p = page - 1;
    }
    var tempPage = currentDoc().pages[p];
    try {
      tempPage.id;
    } catch (e) {
      error("b.page(), " + page + " does not exist.");
    }
    currPage = tempPage;
  } else if (typeof page !== "undefined") {
    error("b.page(), bad type for b.page().");
  }
  updatePublicPageSizeVars();
  if (currDoc.windows.length) {
    app.activeWindow.activePage = currPage;
  } // focus in GUI if not in MODEHIDDEN
  return currentPage();
};

/**
 * Adds a new page to the document. Set the optional location parameter to either b.AT_END (default), b.AT_BEGINNING, b.AFTER or b.BEFORE. b.AFTER and b.BEFORE will use the current page as insertion point.
 *
 * @cat Document
 * @subcat Page
 * @method addPage
 * @param  {String} [location] The location placement mode.
 * @return {Page} The new page.
 */
pub.addPage = function(location) {

  checkNull(location);

  if(arguments.length === 0) {
    location = b.AT_END;
  } // default

  var nP;
  try {

    switch (location) {

      case b.AT_END:
        nP = currentDoc().pages.add(location);
        break;

      case b.AT_BEGINNING:
        nP = currentDoc().pages.add(location);
        break;

      case b.AFTER:
        nP = currentDoc().pages.add(location, pub.page());
        break;

      case b.BEFORE:
        nP = currentDoc().pages.add(location, pub.page());
        break;

      default:
        throw new Error();
        break;
    }

    pub.page(nP);
    return nP;

  } catch (e) {
    error("b.addPage(), invalid location argument passed to addPage()");
  }
};


/**
 * Removes a page from the current document. This will either be the current Page if the parameter page is left empty, or the given Page object or page number.
 *
 * @cat Document
 * @subcat Page
 * @method removePage
 * @param  {Page|Number} [page] The page to be removed as Page object or page number.
 */
pub.removePage = function (page) {
  checkNull(page);
  if(typeof page === "number" || arguments.length === 0 || page instanceof Page) {
    var p = pub.page(page);
    p.remove();
    currPage = null; // reset!
    currentPage();
  } else {
    error("b.removePage(), invalid call. Wrong parameter!");
  }
};

/**
 * Returns the current page number of either the current page or the given Page object.
 *
 * @cat Document
 * @subcat Page
 * @method pageNumber
 * @param  {Page} [pageObj] The page you want to know the number of.
 * @return {Number} The page number within the document.
 */
pub.pageNumber = function (pageObj) {
  checkNull(pageObj);
  if (typeof pageObj === "number") {
    error("b.pageNumber(), cannot be called with a Number argument.");
  }
  if (pageObj instanceof Page) {
    return parseInt(pageObj.name); // current number of given page
  }
  return parseInt(pub.page().name); // number of current page
};

/**
 * Set the next page of the document to be the active one. Returns new active page.
 *
 * @cat Document
 * @subcat Page
 * @method nextPage
 * @return {Page} The active page.
 */
pub.nextPage = function () {
  var p = pub.doc().pages.nextItem(currentPage());
  return pub.page(p);
};


/**
 * Set the previous page of the document to be the active one. Returns new active page.
 *
 * @cat Document
 * @subcat Page
 * @method previousPage
 * @return {Page} The active page.
 */
pub.previousPage = function () {
  var p = pub.doc().pages.previousItem(currentPage());
  return pub.page(p);
};


/**
 * Returns the number of all pages in the current document. If a number is given as an argument,
 * it will set the document's page count to the given number by either adding pages or removing
 * pages until the number is reached. If pages are added, the master page of the document's last
 * page will be applied to the new pages.
 *
 * @cat Document
 * @subcat Page
 * @method pageCount
 * @param  {Number} [pageCount] New page count of the document (integer between 1 and 9999).
 * @return {Number} The amount of pages.
 */
pub.pageCount = function(pageCount) {
  if(arguments.length) {
    if(pub.isInteger(pageCount) && pageCount > 0 && pageCount < 10000) {
      currentDoc().documentPreferences.pagesPerDocument = pageCount;
    } else {
      error("b.pageCount(), wrong arguments! Use an integer between 1 and 9999 to set page count.");
    }
  }
  return currentDoc().pages.count();
};


/**
 * The number of all stories in the current document.
 *
 * @cat Document
 * @subcat Story
 * @method storyCount
 * @return {Number} count The amount of stories.
 */
pub.storyCount = function() {
  return currentDoc().stories.count();
};

/**
 * Adds a page item or a string to an existing story. You can control the position of the insert via the last parameter. It accepts either an InsertionPoint or one the following constants: b.AT_BEGINNING and b.AT_END.
 *
 * @cat Document
 * @subcat Story
 * @method addToStory
 * @param {Story} story The story.
 * @param {PageItem|String} itemOrString The itemOrString either a PageItem, a String or one the following constants: b.AT_BEGINNING and b.AT_END.
 * @param {InsertionPoint|String} insertionPointOrMode InsertionPoint or one the following constants: b.AT_BEGINNING and b.AT_END.
 */
pub.addToStory = function(story, itemOrString, insertionPointorMode) {

  checkNull(story);
  checkNull(itemOrString);

  // init
  var libFileName = "addToStoryLib.indl";

  var libFile = new File(Folder.temp + "/" + libFileName);
  addToStoryCache = app.libraries.itemByName(libFileName);
  // if and a cache is existing from previous executions, remove it
  if (addToStoryCache.isValid) {
    addToStoryCache.close();
    libFile.remove();
  }
  // create an indesign library for caching the page items
  addToStoryCache = app.libraries.add(libFile);

  // self-overwrite, see self-defining-functions pattern
  pub.addToStory = function(story, itemOrString, insertionPointorMode) {
    if (story instanceof Story && arguments.length >= 2) {
      // add string
      if (isString(itemOrString)) {
        if (insertionPointorMode instanceof InsertionPoint) {
          insertionPointorMode.contents = itemOrString;
        } else if (insertionPointorMode === pub.AT_BEGINNING) {
          story.insertionPoints.firstItem().contents = itemOrString;
        } else {
          story.insertionPoints.lastItem().contents = itemOrString;
        }
      }
      // add other stuff
      else {
        // store the item as first asset in cache
        addToStoryCache.store(itemOrString);

        var insertionPoint = null;
        if (insertionPointorMode instanceof InsertionPoint) {
          insertionPoint = insertionPointorMode;
        } else if (insertionPointorMode === pub.AT_BEGINNING) {
          insertionPoint = story.insertionPoints.firstItem();
        } else {
          insertionPoint = story.insertionPoints.lastItem();
        }

        // place & remove from cache
        addToStoryCache.assets.firstItem().placeAsset(insertionPoint);
        addToStoryCache.assets.firstItem().remove();
      }
    } else {
      error("b.addToStory(), wrong arguments! Please use: b.addToStory(story, itemOrString, insertionPointorMode). Parameter insertionPointorMode is optional.");
    }
  };
};


/**
 * Returns the current layer if no argument is given. Sets active layer if layer object or name of existing layer is given. Newly creates layer and sets it to active if new name is given.
 *
 * @cat Document
 * @subcat Page
 * @method layer
 * @param  {Layer|String} [layer] The layer or layer name to set the current layer to.
 * @return {Layer} The current layer instance.
 */
pub.layer = function(layer) {
  checkNull(layer);
  if (layer instanceof Layer) {
    currLayer = layer;
    currentDoc().activeLayer = currLayer;
  } else if (typeof layer === "string") {
    var layers = currentDoc().layers;
    currLayer = layers.item(layer);
    if (!currLayer.isValid) {
      currLayer = layers.add({name: layer});
    } else {
      currentDoc().activeLayer = currLayer;
    }
  } else if (arguments.length > 0) {
    error("b.layer(), wrong arguments. Use layer object or string instead.");
  }
  return currentLayer();
};


/**
 * @description Arranges a page item or a layer before or behind other page items or layers. If using the constants <code>b.FORWARD</code> or <code>b.BACKWARD</code> the object is sent forward or back one step. The constants <code>b.FRONT</code> or <code>b.BACK</code> send the object to the very front or very back. Using <code>b.FRONT</code> or <code>b.BACK</code> together with the optional reference object, sends the object in front or behind this reference object.
 *
 * @cat Document
 * @subcat Page
 * @method arrange
 * @param {PageItem|Layer} pItemOrLayer The page item or layer to be moved to a new position.
 * @param {String} positionOrDirection The position or direction to move the page item or layer. Can be <code>b.FRONT</code>, <code>b.BACK</code>, <code>b.FORWARD</code> or <code>b.BACKWARD</code>.
 * @param {PageItem|Layer} [reference] A reference object to move the page item or layer behind or in front of.
 * @return {PageItem|Layer} The newly arranged page item or layer.
 */
pub.arrange = function(pItemOrLayer, positionOrDirection, reference) {
  checkNull(pItemOrLayer);

  if(pItemOrLayer.hasOwnProperty("parentPage")) {
    if(positionOrDirection === pub.BACKWARD) {
      pItemOrLayer.sendBackward();
    } else if (positionOrDirection === pub.FORWARD) {
      pItemOrLayer.bringForward();
    } else if (positionOrDirection === pub.BACK) {
      pItemOrLayer.sendToBack(reference);
    } else if (positionOrDirection === pub.FRONT) {
      pItemOrLayer.bringToFront(reference);
    } else {
      error("b.arrange(), not a valid position or direction. Please use b.FRONT, b.BACK, b.FORWARD or b.BACKWARD.");
    }
  } else if (pItemOrLayer instanceof Layer) {
    if(positionOrDirection === pub.BACKWARD) {
      if(pItemOrLayer.index === currentDoc().layers.length - 1) return;
      pItemOrLayer.move(LocationOptions.AFTER, currentDoc().layers[pItemOrLayer.index + 1]);
    } else if (positionOrDirection === pub.FORWARD) {
      if(pItemOrLayer.index === 0) return;
      pItemOrLayer.move(LocationOptions.BEFORE, currentDoc().layers[pItemOrLayer.index - 1]);
    } else if (positionOrDirection === pub.BACK) {
      if(!(reference instanceof Layer)) {
        pItemOrLayer.move(LocationOptions.AT_END);
      } else {
        pItemOrLayer.move(LocationOptions.AFTER, reference);
      }
    } else if (positionOrDirection === pub.FRONT) {
      if(!(reference instanceof Layer)) {
        pItemOrLayer.move(LocationOptions.AT_BEGINNING);
      } else {
        pItemOrLayer.move(LocationOptions.BEFORE, reference);
      }
    } else {
      error("b.arrange(), not a valid position or direction. Please use b.FRONT, b.BACK, b.FORWARD or b.BACKWARD.");
    }
  } else {
    error("b.arrange(), invalid first parameter. Use page item or layer.");
  }

  return pItemOrLayer;
};


/**
 *  Returns the Group instance and sets it if argument Group is given.
 *  Groups items to a new group. Returns the resulting group instance. If a string is given as the only
 *  argument, the group by the given name will be returned.
 *
 *  @cat Document
 *  @subCat Page
 *  @method group
 *  @param {Array} pItems An array of page items (must contain at least two items) or name of group instance.
 *  @param {String} [name] The name of the group, only when creating a group from page items.
 *  @return {Group} The group instance.
 */
pub.group = function (pItems, name) {
  checkNull(pItems);
  var group;
  if(pItems instanceof Array) {
    if(pItems.length < 2) {
      error("b.group(), the array passed to b.group() must at least contain two page items.");
    }
    // creates a group from Page Items
    group = currentDoc().groups.add(pItems);
    if(typeof name !== "undefined") {
      group.name = name;
    }
  } else if(typeof pItems === "string") {
    // get the Group of the given name
    group = currentDoc().groups.item(pItems);
    if (!group.isValid) {
      error("b.group(), a group with the provided name doesn't exist.");
    }
  } else {
    error("b.group(), not a valid argument. Use an array of page items to group or a name of an existing group.");
  }

  return group;
};


/**
 *  Ungroups an existing group. Returns an array of the items that were within the group before
 *  b.ungroup() was called.
 *
 *  @cat Document
 *  @subCat Page
 *  @method ungroup
 *  @param {Group|String} group The group instance or name of the group to ungroup.
 *  @return {Array} An array of the ungrouped page items.
 */
pub.ungroup = function(group) {
  checkNull(group);
  var ungroupedItems = null;
  if(group instanceof Group) {
    ungroupedItems = b.items(group);
    group.ungroup();
  } else if(typeof group === "string") {
    // get the Group of the given name
    group = currentDoc().groups.item(group);
    if (!group.isValid) {
      error("b.ungroup(), a group with the provided name doesn't exist.");
    }
    ungroupedItems = b.items(group);
    group.ungroup();
  } else {
    error("b.ungroup(), not a valid group. Please select a valid group.");
  }
  return ungroupedItems;
};


/**
 * Returns items tagged with the given label in the InDesign Script Label pane (Window -> Utilities -> Script Label).
 *
 * @cat Document
 * @subcat Multi-Getters
 * @method labels
 * @param  {String} label The label identifier.
 * @param  {Function} [cb] The callback function to call with each item in the search result. When this function returns false the loop stops. Passed arguments: item, loopCount.
 * @return {Array} Array of concrete PageItem instances, e.g. TextFrame or SplineItem.
 */
pub.labels = function(label, cb) {
  checkNull(label);
  var result = [];
  var doc = currentDoc();
  for (var i = 0, len = doc.pageItems.length; i < len; i++) {
    var pageItem = doc.pageItems[i];
    if (pageItem.label === label) {
      // push pageItem's 1st element to get the concrete PageItem instance, e.g. a TextFrame
      result.push(pageItem.getElements()[0]);
    }
  }
  if (arguments.length === 2 && cb instanceof Function) {
    return forEach(result, cb);
  }
  if(result.length === 0) {
    b.error("b.labels(), no item found with the given label '" + label + "'. Check for line breaks and whitespaces in the script label panel.");
  }
  return result;
};


/**
 * Returns the first item that is tagged with the given label in the InDesign Script Label pane (Window -> Utilities -> Script Label). Use this instead of b.labels, when you know you just have one thing with that label and don't want to deal with a single-element array.
 *
 * @cat Document
 * @subcat Multi-Getters
 * @method label
 * @param  {String} label The label identifier.
 * @return {PageItem} The first PageItem with the given label.
 */
pub.label = function(label) {
  checkNull(label);
  var doc = currentDoc();
  for (var i = 0, len = doc.pageItems.length; i < len; i++) {
    var pageItem = doc.pageItems[i];
    if (pageItem.label === label) {
      return pageItem;
    }
  }
  b.error("b.label(), no item found with the given label '" + label + "'. Check for line breaks and whitespaces in the script label panel.");
};


/**
 * Returns the first currently selected object. Use this if you know you only have one selected item and don't want to deal with an array.
 *
 * @cat Document
 * @subcat Multi-Getters
 * @method selection
 * @return {Object} The first selected object.
 */
pub.selection = function() {
  if(app.selection.length === 0) {
    error("b.selection(), selection is empty. Please select something.");
  }
  return app.selection[0];
};

/**
 * Returns the currently selected object(s)
 *
 * @cat Document
 * @subcat Multi-Getters
 * @method selections
 * @param  {Function} [cb] The callback function to call with each item in the selection. When this function returns false the loop stops. Passed arguments: item, loopCount.
 * @return {Array} Array of selected object(s).
 */
pub.selections = function(cb) {
  if(app.selection.length === 0) {
    error("b.selections(), selection is empty. Please select something.");
  }
  if (arguments.length === 1 && cb instanceof Function) {
    return forEach(app.selection, cb);
  }
  return app.selection;
};

/**
 * Returns the first item on the active page that is named by the given name in the Layers pane (Window -> Layer).
 *
 * @cat Document
 * @subcat Multi-Getters
 * @method nameOnPage
 * @return {Object} The first object on the active page with the given name.
 */
pub.nameOnPage = function(name) {
  checkNull(name);
  var result = null;
  var page = currentPage();
  for (var i = 0, len = page.allPageItems.length; i < len; i++) {
    var pageItem = page.allPageItems[i];
    if (pageItem.name === name) {
      result = pageItem.getElements()[0];
      break;
    }
  }
  if(result === null) {
    b.error("b.nameOnPage(), no item found with the name '" + name + "' on page " + pub.pageNumber());
  }
  return result;
};


/**
 * Sets the units of the document (like right clicking the rulers). The default units of basil.js are PT.
 *
 * @cat Document
 * @method units
 * @param  {String} [units] Supported units: PT, PX, CM, MM or IN.
 * @return {String} Current unit setting.
 */
var unitsCalledCounter = 0;
pub.units = function (units) {
  checkNull(units);
  if (arguments.length === 0) {
    return currUnits;
  }

  if (units === pub.CM ||
      units === pub.MM ||
      units === pub.PT ||
      units === pub.PX ||
      units === pub.IN) {
    var unitType = null;
    if (units === pub.CM) {
      unitType = MeasurementUnits.centimeters;
    } else if (units === pub.MM) {
      unitType = MeasurementUnits.millimeters;
    } else if (units === pub.PT) {
      unitType = MeasurementUnits.points;
    } else if (units === pub.PX) {
      unitType = MeasurementUnits.pixels;
    } else if (units === pub.IN) {
      unitType = MeasurementUnits.inches;
    }
    var doc = currentDoc();

      //* MeasurementUnits.agates
      //* MeasurementUnits.picas
      //* MeasurementUnits.points
      //* MeasurementUnits.inches
      //* MeasurementUnits.inchesDecimal
      //* MeasurementUnits.millimeters
      //* MeasurementUnits.centimeters
      //* MeasurementUnits.ciceros
    doc.viewPreferences.horizontalMeasurementUnits = unitType;
    doc.viewPreferences.verticalMeasurementUnits = unitType;

    currUnits = units;
    updatePublicPageSizeVars();
  } else {
    error("b.unit(), not supported unit");
  }
  if (unitsCalledCounter === 1) {
    warning("Please note that b.units() will reset the current transformation matrix.");
  }
  unitsCalledCounter++;
  return currUnits;
};


/**
 * Creates a vertical guide line at the current spread and current layer.
 *
 * @cat Document
 * @method guideX
 * @param  {Number} x Position of the new guide line.
 * @return {Guide} New guide line.
 */
pub.guideX = function (x) {
  checkNull(x);
  var guides = currentPage().guides;
  var guide = guides.add(currentLayer());
  guide.fitToPage = true;
  guide.orientation = HorizontalOrVertical.VERTICAL;
  guide.location = x;
  return guide;
};


/**
 * Creates a horizontal guide line at the current spread and current layer.
 *
 * @cat Document
 * @method guideY
 * @param  {Number} y Position of the new guide line.
 * @return {Guide} New guide line.
 */
pub.guideY = function (y) {
  checkNull(y);
  var guides = currentPage().guides;
  var guide = guides.add(currentLayer());
  guide.fitToPage = true;
  guide.orientation = HorizontalOrVertical.HORIZONTAL;
  guide.location = y;
  return guide;
};


/**
 * Sets the margins of a given page. If 1 value is given, all 4 sides are set equally. If 4 values are given, the current page will be adjusted. Adding a 5th value will set the margin of a given page. Calling the function without any values, will return the margins for the current page.
 *
 * @cat Document
 * @subcat Page
 * @method margins
 * @param {Number} [top] Top margin or all if only one.
 * @param {Number} [right] Right margin.
 * @param {Number} [bottom] Bottom margin.
 * @param {Number} [left] Left margin.
 * @param {Number} [pageNumber] Sets margins to selected page, currentPage() if left blank.
 * @return {Object} Current page margins with the properties: top, right, bottom, left.
 */
pub.margins = function(top, right, bottom, left, pageNumber) {
  if (arguments.length === 0) {
    return {top: pub.page(pageNumber).marginPreferences.top,
      right: pub.page(pageNumber).marginPreferences.right,
      bottom: pub.page(pageNumber).marginPreferences.bottom,
      left: pub.page(pageNumber).marginPreferences.left
    };
  } else if (arguments.length === 1) {
    right = bottom = left = top;
  }
  if(pageNumber !== undefined) {
    pub.page(pageNumber).marginPreferences.top = top;
    pub.page(pageNumber).marginPreferences.right = right;
    pub.page(pageNumber).marginPreferences.bottom = bottom;
    pub.page(pageNumber).marginPreferences.left = left;
  }else{
    currentPage().marginPreferences.top = top;
    currentPage().marginPreferences.right = right;
    currentPage().marginPreferences.bottom = bottom;
    currentPage().marginPreferences.left = left;
  }
};


/**
 * Sets the document bleeds. If one value is given, all 4 are set equally. If 4 values are given, the top/right/bottom/left document bleeds will be adjusted. Calling the function without any values, will return the document bleed settings.
 *
 * @cat Document
 * @subcat Page
 * @method bleeds
 * @param {Number} [top] Top bleed or all if only one.
 * @param {Number} [right] Right bleed.
 * @param {Number} [bottom] Bottom bleed.
 * @param {Number} [left] Left bleed.
 * @return {Object} Current document bleeds settings.
 */
pub.bleeds = function(top, right, bottom, left) {
  if (arguments.length === 0) {
    return {top: currentDoc().documentPreferences.documentBleedTopOffset,
      right: currentDoc().documentPreferences.documentBleedOutsideOrRightOffset,
      bottom: currentDoc().documentPreferences.documentBleedBottomOffset,
      left: currentDoc().documentPreferences.documentBleedInsideOrLeftOffset
    };
  } else if (arguments.length === 1) {
    right = bottom = left = top;
  }else{
    currentDoc().documentPreferences.documentBleedUniformSize = false;
  }
  currentDoc().documentPreferences.documentBleedTopOffset = top;
  currentDoc().documentPreferences.documentBleedOutsideOrRightOffset = right;
  currentDoc().documentPreferences.documentBleedBottomOffset = bottom;
  currentDoc().documentPreferences.documentBleedInsideOrLeftOffset = left;
};


/**
 * @description Inspects a given object or any other data item and prints the result to the console. This is useful for inspecting or debugging any kind of variable or data item. The optional settings object allows to control the function's output. The following parameters can be set in the settings object:
 * <code>showProps</code>: Show or hide properties. Default: <code>true</code>
 * <code>showValues</code>: Show or hide values. Default: <code>true</code>
 * <code>showMethods</code>: Show or hide methods. Default: <code>false</code>
 * <code>maxLevel</code>: Chooses how many levels of properties should be inspected recursively. Default: <code>1</code>
 * <code>propList</code>: Allows to pass an array of property names to show. If propList is not set all properties will be shown. Default: <code>[]</code> (no propList)
 * If no settings object is set, the default values will be used.
 *
 * @cat Output
 * @method inspect
 * @param  {Object} obj An object or any other data item to be inspected.
 * @param  {Object} [settings] A settings object to control the function's behavior.
 * @param  {Boolean} [settings.showProps] Show or hide properties. Default: <code>true</code>
 * @param  {Boolean} [settings.showValues] Show or hide values. Default: <code>true</code>
 * @param  {Boolean} [settings.showMethods] Show or hide methods. Default: <code>false</code>
 * @param  {Number} [settings.maxLevel] How many levels of properties should be inspected recursively. Default: <code>1</code>
 * @param  {Array} [settings.propList] Array of properties to show. Default: <code>[]</code> (no propList)
 *
 * @example <caption>Inspecting a string</caption>
 * b.inspect("foo");
 *
 * @example <caption>Inspecting the current page, its methods and an additional level of properties</caption>
 * b.inspect(b.page(), {showMethods: true, maxLevel: 2})
 *
 * @example <caption>Inspecting an ellipse, listing only the properties "geometricBounds" and "strokeWeight"</caption>
 * var myEllipse = b.ellipse(0, 0, 10, 10);
 * b.inspect(myEllipse, {maxLevel: 2, propList: ["geometricBounds, strokeWeight"]});
 */
pub.inspect = function (obj, settings, level, branchArray, branchEnd) {

  var output, indent;
  output = indent = "";

  if (!level) {
    level = 0;
    branchArray = [];

    if(!settings) {
      settings = {};
    }

    // set settings object to given values or defaults
    settings.showProps = settings.hasOwnProperty("showProps") ? settings.showProps : true;
    settings.showValues = settings.hasOwnProperty("showValues") ? settings.showValues : true;
    settings.showMethods = settings.hasOwnProperty("showMethods") ? settings.showMethods : false;
    settings.maxLevel = settings.hasOwnProperty("maxLevel") ? settings.maxLevel : 1;
    settings.propList = settings.hasOwnProperty("propList") ? settings.propList : [];

    if(obj === null || obj === undefined) {
      println(obj + "");
      return;
    }

    if(obj.constructor.name === "Array") {
      if(obj.length > 0 && obj.reflect.properties.length < 3) {
        // fixing InDesign's buggy implementation of certain arrays
        // see: https://forums.adobe.com/message/9408120#9408120
        obj = Array.prototype.slice.call(obj, 0);
      }
      output += "[" + obj.join(", ") + "] (Array)";
    } else if (obj.constructor.name === "String") {
      output += "\"" + obj + "\" (String)";
    } else {
      output += obj + " (" + obj.constructor.name + ")";
    }
  } else {
    // setting up tree structure indent
    if(branchArray.length < level) {
      branchArray.push(branchEnd);
    } else if (branchArray.length > level) {
      branchArray.pop();
    }
    if(branchEnd) {
      if(!(level === 1 && settings.showMethods)) {
        branchArray[branchArray.length - 1] = true;
      }
    }
    for (var i = 0; i < level; i++) {
      if(branchArray[i]) {
        indent += "    ";
      } else {
        indent += "|   ";
      }
    }
  }

  if(settings.showProps) {
    var propArray, value, usePropList;

    if(level === 0 && settings.propList.length > 0 && settings.propList.constructor.name === "Array") {
      usePropList = true;
      propArray = settings.propList.reverse();
    } else if (obj.constructor.name === "Array") {
      // correct sorting for Array number properties (0, 1, 2 etc.)
      propArray = obj.reflect.properties.sort(function(a, b) {return a - b}).reverse();
    } else {
      propArray = obj.reflect.properties.sort().reverse();
    }

    if(propArray.length > 1 || usePropList) {
      output += "\n" + indent + "|";

      for (var i = propArray.length - 1; i >= 0; i--) {
        if(propArray[i] == "__proto__" || propArray[i] == "__count__" || propArray[i] == "__class__"|| propArray[i] == "reflect") {
          if(!i) {
            output += "\n" + indent;
          }
          continue;
        }

        if(settings.showValues) {

          try {
            var propValue = obj[propArray[i]];
            if (usePropList && !obj.hasOwnProperty(propArray[i]) && propArray[i] != "length") {
              // in case a non-existing prop is passed via propList
              // "length" needs special handling as it is not correctly recognized as a property
              value = ": The inspected item has no such property.";
            } else if (propValue === null || propValue === undefined) {
              value = ": " + propValue;
            } else if (propValue.constructor.name === "Array") {
              if(propValue.length > 0 && propValue.reflect.properties.length < 3) {
                propValue = Array.prototype.slice.call(propValue, 0);
              }
              value = ": Array (" + propValue.length + ")";
              if(propValue.length && level < settings.maxLevel - 1) {
                // recursive inspecting of Array properties
                value += pub.inspect(propValue, settings, level + 1, branchArray, !i);
              }
            } else if (typeof propValue === "object" && propValue.constructor.name !== "Enumerator"  && propValue.constructor.name !== "Date") {
              value = ": " + propValue;
              if(level < settings.maxLevel - 1) {
                // recursive inspecting of Object properties
                value += pub.inspect(propValue, settings, level + 1, branchArray, !i);
              }
            } else {
              value = ": " + propValue.toString();
            }
          } catch (e) {
            if(e.number === 30615) {
              value = ": The property is not applicable in the current state.";
            } else if (e.number === 55) {
              value = ": Object does not support the property '" + propArray[i] + "'.";
            } else {
              // other InDesign specific error messages
              value = ": " + e.message;
            }
          }

        } else {
          value = "";
        }

        output += "\n" + indent + "|-- " + propArray[i] + value;


        if(!i && !branchEnd && level !== 0) {
          // separation space when a sub-branch ends
          output += "\n" + indent;
        }
      } // end for-loop
    } // end if(propArray.length > 1 || usePropList)
  } // end if(settings.showProps)

  if(level === 0 && settings.showMethods) {

    var methodArray = settings.showMethods ? obj.reflect.methods.sort().reverse() : [];

    if(methodArray.length) {
      output += "\n|" +
                "\n|   METHODS";
    }

    for (var i = methodArray.length - 1; i >= 0; i--) {
      if(methodArray[i].name.charAt(0) === "=") {continue;}
      output += "\n|-- " + methodArray[i] + "()";
    }
  }

  if(level > 0) {
    // return for recursive calls
    return output;
  }
  // print for top level call
  println(output);

};

// ----------------------------------------
// Files & Folders

/**
 * ToDo
 *
 * @cat Files
 * @method file
 * @param {String} filePath The file path.
 * @return {File} File.
 */
pub.file = function(filePath) {
  if(! isString(filePath)) {
    error("b.file(), wrong argument. Use a string that describes a file path.");
  }

  // check if user is referring to a file in the data directory
  if(currentDoc().saved) {
    var file = new File(projectFolder() + "/data/" + filePath);
    if(file.exists) {
      return file;
    }
  }

  // add leading slash to avoid errors on file creation
  if(filePath[0] !== "~" && filePath[0] !== "/") {
    filePath = "/" + filePath;
  }

  return new File(filePath);
};

/**
 * ToDo
 *
 * @cat Files
 * @method folder
 * @param {String} [folderPath] The path of the folder.
 * @return {Folder} Folder.
 */
pub.folder = function(folderPath) {
  if(folderPath === undefined) {
    if(currentDoc().saved) {
      return new Folder(projectFolder() + "/data/");
    } else {
      error("b.folder(), no data folder. The document has not been saved yet, so there is no data folder to access.");
    }
  }
  if(! isString(folderPath)) {
    error("b.folder(), wrong argument. Use a string that describes the path of a folder.");
  }

  // check if user is referring to a folder in the data directory
  if(currentDoc().saved) {
    var folder = new Folder(projectFolder() + "/data/" + folderPath);
    if(folder.exists) {
      return folder;
    }
  }

  // add leading slash to avoid errors on folder creation
  if(folderPath[0] !== "~" && folderPath[0] !== "/") {
    folderPath = "/" + folderPath;
  }

  return new Folder(folderPath);
};

/**
 * ToDo - returns all files from a folder
 *
 * @cat Files
 * @method files
 * @param {Folder|String} [folder] The folder that holds the files or a string describing the path to that folder.
 * @param {Object} [settings] A settings object to control the function's behavior.
 * @param {String|Array} [settings.fileTypes] Suffix(es) of file types to include. Default: <code>"*"</code> (include all file types)
 * @param {Boolean} [settings.includeHidden] Includes hidden files. Default: <code>false</code>
 * @param {Boolean} [settings.recursive] Get files recursively from subfolders. Default: <code>false</code>
 */
pub.files = function(folder, settings, collectedFiles) {
  var topLevel;
  if (collectedFiles === undefined) {
    if(folder === undefined && currentDoc().saved) {
      folder = pub.folder();
    } else if (folder === undefined) {
      error("b.files(), missing first argument. Use folder or a string to describe a folder path or save your document to access the data folder.");
    }
    if(isString(folder)) {
      folder = pub.folder(folder);
    }
    if(!(folder instanceof Folder)) {
      error("b.files(), wrong first argument. Use folder or a string to describe a folder path.");
    } else if (!folder.exists) {
      error("b.files(), the folder \"" + folder + "\" does not exist.");
    }

    topLevel = true;
    collectedFiles = [];

    if(!settings) {
      settings = {};
    }

    // set settings object to given values or defaults
    settings.fileTypes = settings.hasOwnProperty("fileTypes") ? settings.fileTypes : "*";
    settings.includeHidden = settings.hasOwnProperty("includeHidden") ? settings.includeHidden : false;
    settings.recursive = settings.hasOwnProperty("recursive") ? settings.recursive : false;

    if(!(settings.fileTypes instanceof Array)) {
      settings.fileTypes = [settings.fileTypes];
    }
  } else {
    topLevel = false;
  }

  if(settings.recursive) {
    var folderItems = folder.getFiles();
    for (var i = folderItems.length - 1; i >= 0; i--) {
      if (folderItems[i] instanceof Folder) {
        if(!settings.includeHidden && folderItems[i].displayName[0] === ".") continue;
        collectedFiles = pub.files(folderItems[i], settings, collectedFiles);
      }
    }
  }

  for (var i = settings.fileTypes.length - 1; i >= 0; i--) {
    var mask = "*." + settings.fileTypes[i];
    var fileItems = folder.getFiles(mask);
    for (var j = fileItems.length - 1; j >= 0; j--) {
      if(!settings.includeHidden && fileItems[j].displayName[0] === ".") continue;
      if(!(fileItems[j] instanceof File)) continue;
      collectedFiles.push(fileItems[j]);
    }
  }

  return topLevel ? collectedFiles.reverse() : collectedFiles;
};

/**
 * ToDo
 *
 * @cat Files
 * @method selectFile
 * @param {String} [prompt] The prompt text at the top of the selection dialog.
 * @return {File|Null} The selected file. If the user cancels, <code>null</code> will be returned.
 */
pub.selectFile = function(prompt) {
  var file;
    b.println("CP1");
    b.println(isString(prompt));
    b.println("CP2");
  if(isString(prompt)) {
    file = File.openDialog(prompt);
  } else {
    file = File.openDialog();
  }
  return file;
};

// ----------------------------------------
// Date

/**
 * The year() function returns the current year as an integer (2012, 2013 etc).
 *
 * @cat Environment
 * @subcat Date
 * @method year
 * @return {Number} The current year.
 */
pub.year = function() {
  return (new Date()).getFullYear();
};


/**
 * The month() function returns the current month as a value from 1 - 12.
 *
 * @cat Environment
 * @subcat Date
 * @method month
 * @return {Number} The current month number.
 */
pub.month = function() {
  return (new Date()).getMonth() + 1;
};


/**
 * The day() function returns the current day as a value from 1 - 31.
 *
 * @cat Environment
 * @subcat Date
 * @method day
 * @return {Number} The current day number.
 */
pub.day = function() {
  return (new Date()).getDate();
};


/**
 * The weekday() function returns the current weekday as a string from Sunday, Monday, Tuesday...
 *
 * @cat Environment
 * @subcat Date
 * @method weekday
 * @return {String} The current weekday name.
 */
pub.weekday = function() {
  var weekdays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
  return weekdays[(new Date()).getDay()];
};


/**
 * The hour() function returns the current hour as a value from 0 - 23.
 *
 * @cat Environment
 * @subcat Date
 * @method hour
 * @return {Number} The current hour.
 */
pub.hour = function() {
  return (new Date()).getHours();
};


/**
 * The minute() function returns the current minute as a value from 0 - 59.
 *
 * @cat Environment
 * @subcat Date
 * @method minute
 * @return {Number} The current minute.
 */
pub.minute = function() {
  return (new Date()).getMinutes();
};


/**
 * The second() function returns the current second as a value from 0 - 59.
 *
 * @cat Environment
 * @subcat Date
 * @method second
 * @return {Number} The current second.
 */
pub.second = function() {
  return (new Date()).getSeconds();
};


/**
 * Returns the number of milliseconds (thousandths of a second) since starting an applet.
 *
 * @cat Environment
 * @subcat Date
 * @method millis
 * @return {Number} The current milli.
 */
pub.millis = function() {
  return Date.now() - startTime;
};


/**
 * The millisecond() function differs from millis(), in that it returns the exact millisecond (thousandths of a second) of the current time.
 *
 * @cat Environment
 * @subcat Date
 * @method millisecond
 * @return {Number} The current millisecond.
 */
pub.millisecond = function() {
  return (new Date()).getMilliseconds();
};


/**
 * The timestamp() function returns the current date formatted as YYYYMMDD_HHMMSS for useful unique filenaming.
 *
 * @cat Environment
 * @subcat Date
 * @method timestamp
 * @return {String} The current time in YYYYMMDD_HHMMSS.
 */
pub.timestamp = function() {
  var dt = new Date();
  var dtf = dt.getFullYear();
  dtf += pub.nf(dt.getMonth() + 1, 2);
  dtf += pub.nf(dt.getDate(), 2);
  dtf += "_";
  dtf += pub.nf(dt.getHours(), 2);
  dtf += pub.nf(dt.getMinutes(), 2);
  dtf += pub.nf(dt.getSeconds(), 2);
  return dtf;
};
