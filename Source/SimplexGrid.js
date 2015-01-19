
SimplexGrid = function (options) {
    "use strict";
    this.gridOptions = options;
    this.columnNames = new Array();
    this.columnDictionary = new Array(); // columnName - column object key-value list.
    this.columnCount = 0;
    this.tableId = "tpro_tbl_" + options.gridName;
    this.nextPageId = this.tableId + "_next_page_btn";
    this.prevPageId = this.tableId + "_prev_page_btn";
    this.firstPageId = this.tableId + "_first_page_btn";
    this.lastPageId = this.tableId + "_last_page_btn";
    this.filterApplyButtonId = this.tableId + "_apply_filter_lnk";
    this.filterClearButtonId = this.tableId + "_clear_filter_lnk";
    this.filterTableId = this.tableId + "_apply_filter_criteria_table";
    this.editorTableAddId = "";
    this.editorTableEditId = "";
    this.editorTableDeleteId = "";
    this.currentPageNo = 0;
    this.totalRecordCount = isNaN(options.totalRecordCount) ? 0 : options.totalRecordCount;
    this.gridOptions.pageSize = isNaN(options.pageSize) || (options.pageSize <= 0) ? 1 : options.pageSize; // Default to 1
    this.gridMasterDataSet = null;
    this.gridFilteredDataSet = null;
    this.version = "0.5.0";

    var headerTable = "<table class='slx_grid'><thead><tr>";
    var cssHiddenClass;
    for (var i = 0; i < this.gridOptions.model.length; i++) {
        var columnModel = this.gridOptions.model[i];
        if (columnModel.hidden === true)
            cssHiddenClass = "slx_grid_hidden_col";
        else {
            cssHiddenClass = "";
        }
        headerTable += "<th class='" + cssHiddenClass + "' style='width:" + columnModel.width + ";'>" + columnModel.displayName + "</th>";
        this.columnNames.push(columnModel.name);
        this.columnDictionary[columnModel.name] = columnModel;
        this.columnCount++;
    }
    headerTable += "<th class='slx_grid_hidden_col'>slx_grid_row_data</th>";
    headerTable += "</tr></thead></table>";

    var containerHeight = this.gridOptions.pageSize * 30; // Approx height of a row.
    var bodyTableContainer = "<div style='height: " + containerHeight + "px; overflow: scroll;'>";
    bodyTableContainer += "<table class='slx_grid' id='" + this.tableId + "'><tbody></tbody></table>";
    bodyTableContainer += "</div>";

    var combinedHtml = headerTable + bodyTableContainer;

    var controlPanel = "<table class='slx_grid_ctrl_panel'><tr><td style='width:1%;white-space:nowrap;'>";
    if (this.gridOptions.enableAdd === true || this.gridOptions.enableEdit === true || this.gridOptions.enableDelete === true) {
        var editorTableId = this.tableId + "_editor_table";
        this.editorTableAddId = editorTableId + "_add";
        this.editorTableEditId = editorTableId + "_edit";
        this.editorTableDeleteId = editorTableId + "_delete";
        var editorTable = "<table class='slx_grid_editbar'><tr>";
        if (this.gridOptions.enableAdd === true) {
            editorTable += "<td><a href='#' id='" + this.editorTableAddId + "'>Add</a></td>";
        }
        if (this.gridOptions.enableEdit === true) {
            editorTable += "<td><a href='#' id='" + this.editorTableEditId + "'>Edit</a></td>";
        }
        if (this.gridOptions.enableDelete === true) {
            editorTable += "<td><a href='#' id='" + this.editorTableDeleteId + "'>Delete</a></td>";
        }
        editorTable += "</tr></table>";
        controlPanel += editorTable;
    }
    controlPanel += "</td><td>";

    if (this.gridOptions.enablePaging === true) {
        this.buttonBarTableId = this.tableId + "_btn_bar";
        var buttonBarTable = "<table id='" + this.buttonBarTableId + "' class='slx_grid_bbar'><tr><td>";
        buttonBarTable += "<button id='" + this.firstPageId + "' class='slx_grid_first_page' title='First page'>&#171;</button>";
        buttonBarTable += "<button id='" + this.prevPageId + "' class='slx_grid_prev_page' title='Previous page'>&#139;</button>";
        buttonBarTable += "<button id='" + this.nextPageId + "' class='slx_grid_nxt_page' title='Next page'>&#155;</button>";
        buttonBarTable += "<button id='" + this.lastPageId + "' class='slx_grid_last_page' title='Last page' >&#187;</button>";

        buttonBarTable += "</td>";
        buttonBarTable += "</tr></table>";
    }
    controlPanel += buttonBarTable + "</td>"; //end paging buttons

    controlPanel += "<td>"; // begin options

    this.optionsBarTableId = this.tableId + "_options_bar";
    this.optionChkSHowFilterId = this.optionsBarTableId + "_chk_show_filter";
    var optionsTable = "<table id='" + this.optionsBarTableId + "' class='slx_grid_opt_bar'>";
    optionsTable += "<tr>";
    if (this.gridOptions.enableFilter === true) {
        optionsTable += "<td>Show Filter <input type='checkbox' id='" + this.optionChkSHowFilterId + "' checked='checked'/></td>";
    }
    optionsTable += "</tr>";
    optionsTable += "</table>";
    controlPanel += optionsTable + "</td>"; // End options
    controlPanel += "</tr></table>"; // End of control panel markup
    combinedHtml += controlPanel;

    if (this.gridOptions.enableFilter === true) {
        var filterTable = "<table id='" + this.filterTableId + "' class='slx_grid_filter_bar'>";
        var srchIdPrfx = "txt_search_owner", filterlabelRow = "<tr>", filterBoxRow = "<tr>";
        for (var i = 0; i < this.gridOptions.model.length; i++) {
            columnModel = this.gridOptions.model[i];
            if (columnModel.searchable === true) {
                filterlabelRow += "<td style='vertical-align: middle;'><span>" + columnModel.displayName + "</span></td>";
                filterBoxRow += "<td style='white-space: nowrap;width: 1%;'><input type='text' id='" + srchIdPrfx + columnModel.name + "' colName='" + columnModel.name + "' /></td>";
            }
        }
        filterlabelRow += "</tr>";
        filterBoxRow += "<td style='text-align: right;'><a href='#' class='slx_grid_apply_filter' id='" + this.filterClearButtonId + "'>Clear</a>&nbsp;<a href='#' class='slx_grid_apply_filter' id='" + this.filterApplyButtonId + "'>Apply</a></td>";
        filterBoxRow += "</tr>";
        filterTable += filterlabelRow + filterBoxRow + "</table>";

        combinedHtml += filterTable;
    }

    var tempDiv = document.createElement("div");
    tempDiv.innerHTML = combinedHtml;
    this.container = tempDiv;
};

SimplexGrid.prototype.onDataNeededHandler = function (mode, gridRef) {

    if (mode === "previous" && this.currentPageNo > 0) {
        this.currentPageNo--;
    }
    else if (mode === "next") {
        if (this.gridOptions.enablePaging === true && this.gridOptions.autoPaging === true) {
            // Increment the currentPageNo only if we have one more page.
            var remainingCount = this.totalRecordCount - (this.currentPageNo * this.gridOptions.pageSize);
            if (remainingCount >= this.gridOptions.pageSize) {
                this.currentPageNo++;
            }
        } else {
            this.currentPageNo++;
        }
    }
    else if (mode === "filter") {
        // Do nothing.
    } else if (mode === "first") {
        this.currentPageNo = 0;
    } else if (mode === "last") {
        var mod = this.totalRecordCount % this.gridOptions.pageSize;
        this.currentPageNo = (this.totalRecordCount - mod) / this.gridOptions.pageSize;
        this.currentPageNo = isNaN(this.currentPageNo) ? 0 : this.currentPageNo;
    }

    if (this.gridOptions.enablePaging === true && this.gridOptions.autoPaging === true) {
        // Automatic paging.

        // Feed the loadPageData with the filtered data set again and it will take care of the paging.
        var tempDataSet = null;
        if (mode === "filter") {
            // The data set is about to change due to filter. So reset the current page number to 0.
            this.currentPageNo = 0;
            // Get filter criteria.
            var filters = this.getFilters();
            // Filter data using 'LIKE' style.
            this.gridFilteredDataSet = this.getFilteredData(this.gridMasterDataSet, filters);
            tempDataSet = this.gridFilteredDataSet;
        } else {
            if (this.gridFilteredDataSet !== null && this.gridFilteredDataSet.length > 0) {
                tempDataSet = this.gridFilteredDataSet;
            } else {
                tempDataSet = this.gridMasterDataSet;
            }
        }

        this.loadPageData(tempDataSet);
    } else if (typeof this.gridOptions.onDataNeeded == "function") {
        // Manual paging.
        // Get filter criteria.
        var filterObj = this.getFilters();
        this.gridOptions.onDataNeeded(mode, gridRef, filterObj);
    }


    return false;
};

SimplexGrid.prototype.clearFilters = function () {
    jQuery("#" + this.filterTableId + " input").val('');
    return false;
};

SimplexGrid.prototype.getFilters = function () {
    var txtBoxes = jQuery("#" + this.filterTableId + " input");
    var filterObj = {};
    for (var i = 0; i < txtBoxes.length; i++) {
        // Only set the filters if there are values.
        if (txtBoxes[i].value.length > 0) {
            var columnName = txtBoxes[i].getAttribute("colName");
            filterObj[columnName] = txtBoxes[i].value;
        }
    }

    return filterObj;
};

SimplexGrid.prototype.doubleClick = function (rowObject) {
    if (typeof this.gridOptions.doubleClick == "function") {
        this.gridOptions.doubleClick(rowObject);
    }
    return false;
};

SimplexGrid.prototype.createGrid = function (data) {
    "use strict";
    // Create the grid and wire up event handlers.

    // Don't show it in the UI yet.
    var containerElement = document.getElementById(this.gridOptions.containerId);
    containerElement.style.visibility = "hidden";
    containerElement.innerHTML = this.container.outerHTML; // Add table to container div (this.container.innerHTML will faile in FF & Chrome)
    containerElement.className += "slx_grid_container"; // Add the style, but don't remove any existing classes user might have applied.

    // These event handlers works only if it is after the previous line where the dynamic html is 
    // appended to an existing element in the DOM.
    var self = this;
    if (this.gridOptions.enablePaging === true) {
        document.getElementById(this.nextPageId).onclick = function () {
            self.onDataNeededHandler("next", self);
            return false;
        };
        document.getElementById(this.prevPageId).onclick = function () {
            self.onDataNeededHandler("previous", self);
            return false;
        };
        document.getElementById(this.firstPageId).onclick = function () {
            self.onDataNeededHandler("first", self);
            return false;
        };
        document.getElementById(this.lastPageId).onclick = function () {
            self.onDataNeededHandler("last", self);
            return false;
        };
    }
    if (this.gridOptions.enableFilter === true) {
        document.getElementById(this.filterApplyButtonId).onclick = function () {
            self.onDataNeededHandler("filter", self);
            return false;
        };
        document.getElementById(this.filterClearButtonId).onclick = function () {
            self.clearFilters();
            self.onDataNeededHandler("filter", self);
            return false;
        };
        document.getElementById(this.optionChkSHowFilterId).onclick = function () {
            var visible;
            if (this.checked) visible = "";
            else visible = "hidden";
            document.getElementById(self.filterTableId).style.visibility = visible;
        };
    }
    // Bind editor buttons.
    if (this.gridOptions.enableAdd === true || this.gridOptions.enableEdit === true || this.gridOptions.enableDelete === true) {
        if (this.gridOptions.enableAdd === true) {
            document.getElementById(this.editorTableAddId).onclick = function () {
                if (typeof self.gridOptions.onAdd == "function") {
                    self.gridOptions.onAdd(self);
                }
                return false;
            };
        }
        if (this.gridOptions.enableEdit === true) {
            document.getElementById(this.editorTableEditId).onclick = function () {
                if (typeof self.gridOptions.onEdit == "function") {
                    var rowobjects = self.getSelectedRowObjects();
                    if (rowobjects != null && rowobjects.length > 0) {
                        self.gridOptions.onEdit(rowobjects, self);
                    }
                }
                return false;
            };
        }
        if (this.gridOptions.enableDelete === true) {
            document.getElementById(this.editorTableDeleteId).onclick = function () {
                if (typeof self.gridOptions.onDelete == "function") {
                    var rowobjects = self.getSelectedRowObjects();
                    if (rowobjects != null && rowobjects.length > 0) {
                        self.gridOptions.onDelete(rowobjects, self);
                    }
                }
                return false;
            };
        }
    }

    // Fill data.
    this.loadData(data);
};

// Called only once during Auto Paging
SimplexGrid.prototype.loadData = function (dataSet) {
    this.gridMasterDataSet = dataSet;

    this.loadPageData(dataSet);
};

// Only to be called from paging.
SimplexGrid.prototype.loadPageData = function (mayBeFilteredDataSet) {
    "use strict";

    var dataPage;
    if (this.gridOptions.enablePaging === true && this.gridOptions.autoPaging === true) {

        // Set the current dataset's length
        this.totalRecordCount = mayBeFilteredDataSet.length;

        // Extract the right page from the data set using 'this.currentPageNo' and 'this.PageSize'.
        var startIndex = this.currentPageNo * this.gridOptions.pageSize;
        var endIndex = startIndex + this.gridOptions.pageSize;
        dataPage = mayBeFilteredDataSet.slice(startIndex, endIndex);
    } else {
        dataPage = mayBeFilteredDataSet;
    }

    var rows = "", columnName, hiddenClass;
    if (dataPage.length > 0) {
        for (var i = 0; i < dataPage.length; i++) {
            rows += "<tr>";
            for (var j = 0; j < this.columnNames.length; j++) {
                columnName = this.columnNames[j];
                var colModel = this.columnDictionary[columnName];
                if (colModel.hidden === true) hiddenClass = "slx_grid_hidden_col";
                else hiddenClass = "";
                rows += "<td class='" + hiddenClass + "' style='text-align: center; width:" + colModel.width + ";'>" + dataPage[i][columnName] + "</td>";
            }
            var rowdataString = JSON.stringify(dataPage[i]);
            rows += "<td class='slx_grid_hidden_col slx_row_dataHolder'>" + rowdataString + "</td>";
            rows += "</tr>";
        }
    } else {
        rows = "<tr><td style='vertical-align: middle; text-align: center; border:0px;font-size: small;'>No records found</td></tr>";
    }

    jQuery("#" + this.tableId).find("tbody").empty(); // Only empty the table with dataPage (not paging buttons, filters etc.)
    jQuery("#" + this.tableId).find("tbody:last").append(rows);
    jQuery(".slx_grid tr:even").css("background-color", "rgb(235, 236, 236)"); // Alternate row colors

    // Add double-click handler for TRs.
    var self = this;
    jQuery("#" + this.tableId + " tr").dblclick(function (context) {
        var results = jQuery(context.target.parentElement).find(".slx_row_dataHolder");
        self.doubleClick(results[0].innerText);
    });
    jQuery("#" + this.tableId + " tr").click(function (context) {
        // 'context.currentTarget' is the clicked TR.
        self.toggleRowSelection(context.currentTarget);
    });
};

SimplexGrid.prototype.getFilteredData = function (dataSet, filters) {
    var filteredSet = new Array();
    for (var i = 0; i < dataSet.length; i++) {
        var current = dataSet[i];
        var passed = true;
        for (var colName in filters) {
            if (current[colName].indexOf(filters[colName]) < 0) {
                passed = false;
                break;
            }
        }
        if (passed === true) {
            filteredSet.push(current);
        }
    }

    return filteredSet;
};

SimplexGrid.prototype.showGrid = function () {
    "use strict";
    // For some reason, both the below settings are necessary for the div to be visible (which is invisible by default)
    document.getElementById(this.gridOptions.containerId).style.display = "block";
    document.getElementById(this.gridOptions.containerId).style.visibility = "visible";
};

SimplexGrid.prototype.hideGrid = function () {
    "use strict";
    document.getElementById(this.gridOptions.containerId).style.display = "none";
};

SimplexGrid.prototype.destroy = function () {
    "use strict";
    document.getElementById(this.gridOptions.containerId).innerHTML = null;
};

SimplexGrid.prototype.toggleRowSelection = function (row) {
    row.className = row.className == 'slx_grid_sel_row' ? '' : 'slx_grid_sel_row';
};

SimplexGrid.prototype.getSelectedRowObjects = function() {
    var cells = jQuery("#" + this.tableId).find("tbody").find(".slx_grid_sel_row").find(".slx_row_dataHolder");
    var rowobjects = [];
    for (var i = 0; i < cells.length; i++) {
        rowobjects.push(cells[i].innerText);
    }
    return rowobjects;
};

/* API Documentation */
/*
    Grid Constructor Options
    ------------
    gridName            : Not nullable. Grid's name. This is also used form part of several element's id. 
    totalRecordCount    : Nullable. This is the total count of the data set. This is used to compute the paging arithmetic. Defaults to 0 if not supplied.
    pageSize            : Nullable. Number of records visible in the grid. Defaults to 1 if not supplied.
    enablePaging        : Nullable. Enables/disables paging and makes the paging controls unavailable. (true/false}
    autoPaging          : Nullable. If set to 'true', accepts the entire data set and pages according to 'pageSize'.
    enableAdd           : Nullable. If set to 'true', displays an 'Add' button in the button bar.
    enableEdit          : Nullable. If set to 'true', displays an 'Edit' button in the button bar.
    enableDelete        : Nullable. If set to 'true', displays a 'Delete' button in the button bar.
    onAdd               : Nullable. A function to handle the event. Arguments - 1. The current instance of grid. See behaviors for more information.
    onEdit              : Nullable. A function to handle the event. Arguments - 1. The current instance of grid. 2. Selected rows' data object as JSON array. See behaviors for more information.
    onDelete            : Nullable. A function to handle the event. Arguments - 1. The current instance of grid. 2. Selected rows' data object as JSON array. See behaviors for more information.
    onDataNeeded        : Not nullable if 'autoPaging' is 'false'. A function to handle the event. If 'autoPaging' is false, you need to provide one page's data at a time.
                          The event arguments contains the following.
                            mode            : Direction/action of the paging just happened.
                            grid            : Current instance of the grid.
                            filterObject    : Currently applied filter criteria as an object. Column names provided in the model are property names.
    doubleClick         : Nullable. Function to handle the row double click event.
                          The event arguments contains the following.
                            currentObject   : Double clicked row's data object as JSON. Grid's data set is an object array and every row represents an item from the array.
    enableFilter        : Nullable. Enables/disables the filtering option for grid.
    model               : Not nullable. 
    {
        name        : Not nullable. Underlying column's unique name (e.g. column name from a database table).
        displayName : Nullable. Column's header/title
        hidden      : Nullable. Visibility status of a columns {true/false}
        searchable  : Nullable. Displays a text box for this column in the filter bar.
        width       : Width of the grid's column. All valid values for the 'width' property in CSS are accepted.
    }
*/

/*
Grid Properties
---------------
gridOptions             : All the options supplied during the object construction.
gridMasterDataSet       : The current master data set (before filters are applied).
gridFilteredDataSet     : Filtered data set (after applying any filters - changes every time 'Apply Filter' is called.
currentPageNo           : The current page number. This is accurate/reliable only when 'autoPaging' is set to 'true'.
/*

/*
Methods
-------
createGrid              : Creates the grid.
*/

/*
Notes
---------
1. Paging
    a. Paging doesn't process filters
    b. Paging always operate on current data set.
    c. Filters should be applied on current data set before paging.
    d. Any time filters are set, currrent page is reset to 0 and paging will start from the begining.
2.  Add Record
    a. You can get the current grid instance from the arguements of 'onAdd' event.
*/

