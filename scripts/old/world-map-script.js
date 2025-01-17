// An exmaple of HTML tag
// <div id="world-map-visualization-0717"
//     class="world-map-visualization"
//     google-sheet-id="14xd4jJ8Qukl7dyp0vGJ5k8qxMUgHIuMGxGrIspm2zx8"
//     data-table = "1"
//     data-settings-table = "2"></div>

const worldMapVisualizationClass = "world-map-visualization";

//Collect all elements, where evidence gap map is needed
let worldMapElementsArray = document.querySelectorAll(
  "." + worldMapVisualizationClass
);
const valueSeparator = "|"; //Separator is used to separate values in cells of sheet

//Applying logic for every world map element
worldMapElementsArray.forEach((worldMapElement) => {
  const mainComponentId = worldMapElement.attributes.id.value;
  const chartContainerId = mainComponentId + "-world-map-container";
  const tableId = mainComponentId + "-table";
  const filterWrapperBlockId = mainComponentId + "-filter-wrapper-block";
  const updateButtonId = mainComponentId + "-update-visualization-btn";
  const exportToCSVButtonId = mainComponentId + "-export-to-csv-btn";

  const filterSelectClass = mainComponentId + "-visualization-filter-select";

  const googleSheetId = worldMapElement.attributes["google-sheet-id"].value;

  const numberOfDataTableInGoogleSheet =
    +worldMapElement.attributes["data-table"].value || 1;
  const numberOfSettingsTableInGoogleSheet =
    +worldMapElement.attributes["data-settings-table"].value || 2;

  //Get data from google sheet
  getGoogleSheet(
    googleSheetId,
    numberOfDataTableInGoogleSheet,
    numberOfSettingsTableInGoogleSheet
  ).then((data) => {
    let config = getSettingsObject(data.settings);

    const studyTitleLetter = config.studyTitleLetter;
    const studyLinkLetter = config.studyLinkLetter;
    const studyCountryLetter = config.studyCountryLetter;
    const filtersBlockArray = config.filtersBlockArray;
    const tableColumnTitlesArray = config.tableColumnTitlesArray;

    //Prepare an array of studies
    let studiesArray = getStudiesArray(
      data.sheet,
      studyTitleLetter,
      studyLinkLetter,
      studyCountryLetter,
      filtersBlockArray,
      tableColumnTitlesArray
    );

    //Prepare initial structure for filters data
    let filtersValuesFromSheetArray = getValuesForFiltersArray(
      studiesArray,
      filtersBlockArray
    );

    //Create map
    createWorldMapComponent(
      mainComponentId,
      chartContainerId,
      updateButtonId,
      studiesArray,
      [],
      studyCountryLetter,
      filterSelectClass,
      filtersBlockArray
    );

    //Create table
    createTableComponent(
      mainComponentId,
      tableId,
      exportToCSVButtonId,
      studiesArray,
      tableColumnTitlesArray,
      studyTitleLetter
    );

    //Hide table
    makeTableVisible(false, tableId);

    //Create filters' block
    createFiltersBlockComponent(
      mainComponentId,
      filterWrapperBlockId,
      updateButtonId,
      filterSelectClass,
      filtersBlockArray,
      filtersValuesFromSheetArray
    );

    //Set up all updating logic here
    document
      .getElementById(updateButtonId)
      .addEventListener("click", async function (event) {
        updateVisualization(
          mainComponentId,
          chartContainerId,
          tableId,
          updateButtonId,
          exportToCSVButtonId,
          filterSelectClass,
          studiesArray,
          tableColumnTitlesArray,
          filtersBlockArray,
          studyTitleLetter,
          studyCountryLetter
        );
      });

    //Highlight specific filter depend on url
    highlightFilter();
  });
});

function getSettingsObject(settings) {
  const cellsArray = settings.feed.entry;
  const numberOfColumns = getNumberOfColumns(cellsArray);

  //||Study title column letter||Country column letter||Study link column letter ||Filter titles||Filter column letter||Filter default values||Table column titles||Table column title letter||
  //||B                        ||C                    ||D                        ||Country      ||C                   || First | Second      ||Study              || B                       ||

  const columnLetterOfStudyTitleColumnLetter = "A";
  const columnLetterOfCountryColumnLetter = "B";
  const columnLetterOfStudyLinkColumnLetter = "C";
  const columnLetterOfFilterTitles = "D";
  const columnLetterOfFilterColumnLetter = "E";
  const columnLetterOfFilterDefaultValues = "F";
  const columnLetterOfTableColumnTitles = "G";
  const columnLetterOfTableColumnTitleLetter = "H";

  let tempStudyTitleLetter = "";
  let tempStudyCountryLetter = "";
  let tempStudyLinkLetter = "";
  let tempFiltersBlockArray = [];
  let temptableColumnTitlesArray = [];

  let tempFiltersBlockItem = {
    letter: "",
    title: "",
    defaultValues: [],
  };

  let tempTableColumnItem = {
    letter: "",
    title: "",
  };

  cellsArray.forEach((element, index, array) => {
    if (index >= numberOfColumns) {
      if (
        !tempStudyTitleLetter &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfStudyTitleColumnLetter
      ) {
        tempStudyTitleLetter = element.content["$t"].trim();
      }

      if (
        !tempStudyCountryLetter &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfCountryColumnLetter
      ) {
        tempStudyCountryLetter = element.content["$t"].trim();
      }

      if (
        !tempStudyLinkLetter &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfStudyLinkColumnLetter
      ) {
        tempStudyLinkLetter = element.content["$t"].trim();
      }

      if (
        element.title["$t"].match(/([A-z]+)/g) == columnLetterOfFilterTitles
      ) {
        tempFiltersBlockItem.title = element.content["$t"].trim();
      }

      if (
        tempFiltersBlockItem.title == array[index - 1].content["$t"].trim() &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfFilterColumnLetter
      ) {
        tempFiltersBlockItem.letter = element.content["$t"].trim();
      }

      if (
        tempFiltersBlockItem.title == array[index - 2].content["$t"].trim() &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfFilterDefaultValues
      ) {
        element.content["$t"].split(valueSeparator).forEach((cellValue) => {
          tempFiltersBlockItem.defaultValues.push(cellValue.trim());
        });
      }

      if (
        element.title["$t"].match(/([A-z]+)/g) ==
        columnLetterOfTableColumnTitles
      ) {
        tempTableColumnItem.title = element.content["$t"].trim();
      }

      if (
        tempTableColumnItem.title == array[index - 1].content["$t"].trim() &&
        element.title["$t"].match(/([A-z]+)/g) ==
          columnLetterOfTableColumnTitleLetter
      ) {
        tempTableColumnItem.letter = element.content["$t"].trim();
      }

      if (
        typeof array[index + 1] === "undefined" ||
        array[index].title["$t"] > array[index + 1].title["$t"]
      ) {
        if (tempFiltersBlockItem.title && tempFiltersBlockItem.letter) {
          tempFiltersBlockArray.push(tempFiltersBlockItem);
        }
        if (tempTableColumnItem.title && tempTableColumnItem.letter) {
          temptableColumnTitlesArray.push(tempTableColumnItem);
        }

        tempFiltersBlockItem = {
          letter: "",
          title: "",
          defaultValues: [],
        };

        tempTableColumnItem = {
          letter: "",
          title: "",
        };
      }
    }
  });

  let resultObj = {
    studyTitleLetter: tempStudyTitleLetter,
    studyCountryLetter: tempStudyCountryLetter,
    studyLinkLetter: tempStudyLinkLetter,
    filtersBlockArray: tempFiltersBlockArray,
    tableColumnTitlesArray: temptableColumnTitlesArray,
  };

  return resultObj;
}

function updateVisualization(
  mainComponentId,
  chartContainerId,
  tableId,
  updateButtonId,
  exportToCSVButtonId,
  filterSelectClass,
  studiesArray,
  tableColumnTitlesArray,
  filtersBlockArray,
  studyTitleLetter,
  studyCountryLetter
) {
  let chartContainerElement = document.getElementById(chartContainerId);
  let tableButtonBlockElement = document.getElementById(
    mainComponentId + "-table-button-block-wrapper"
  );
  let tableContainerElement = document.getElementById(tableId + "-container");
  let tablePaginationBlock = document.getElementById(
    tableId + "-pagination-block"
  );

  tableContainerElement.parentNode.removeChild(tableContainerElement);
  chartContainerElement.parentNode.removeChild(chartContainerElement);
  tableButtonBlockElement.parentNode.removeChild(tableButtonBlockElement);
  tablePaginationBlock.parentNode.removeChild(tablePaginationBlock);

  let filtersValuesFromFilterBlockArray = getValuesFromFilterBlock(
    filtersBlockArray,
    filterSelectClass
  );

  let studiesFilteredArray = getFilteredStudiesArray(
    studiesArray,
    filtersValuesFromFilterBlockArray
  );

  createWorldMapComponent(
    mainComponentId,
    chartContainerId,
    updateButtonId,
    studiesFilteredArray,
    filtersValuesFromFilterBlockArray,
    studyCountryLetter,
    filterSelectClass,
    filtersBlockArray
  );

  createTableComponent(
    mainComponentId,
    tableId,
    exportToCSVButtonId,
    studiesFilteredArray,
    tableColumnTitlesArray,
    studyTitleLetter
  );

  makeTableVisible(true, tableId);

  filtersValuesFromFilterBlockArray = [];
}

async function getGoogleSheet(
  spreadsheetID,
  numberOfDataTableInGoogleSheet,
  numberOfSettingsTableInGoogleSheet
) {
  // https://www.youtube.com/watch?v=MDKph2XhqXc
  try {
    const response = await fetch(
      `https://spreadsheets.google.com/feeds/worksheets/${spreadsheetID}/public/basic?alt=json`
    );
    const responseJSON = await response.json();
    const sheet = await fetch(
      responseJSON.feed.entry[numberOfDataTableInGoogleSheet - 1].link[1].href +
        "?alt=json"
    );
    const sheetJSON = await sheet.json();

    const settings = await fetch(
      responseJSON.feed.entry[numberOfSettingsTableInGoogleSheet - 1].link[1]
        .href + "?alt=json"
    );
    const settingsJSON = await settings.json();

    return { sheet: sheetJSON, settings: settingsJSON };
  } catch (error) {
    console.log(error);
  }
}

function getStudiesArray(
  data,
  studyTitleLetter,
  studyLinkLetter,
  studyCountryLetter,
  filtersBlockArray,
  tableColumnTitlesArray
) {
  let studiesArray = [];
  const cellsArray = data.feed.entry;
  const numberOfColumns = getNumberOfColumns(cellsArray);

  let tempStudyTitle = "";
  let tempStudyLink = "";
  let tempStudyCountriesArray = [];
  let tempFiltersBlockArray = initializeStudiesValuesArray(filtersBlockArray);
  let temptableColumnTitlesArray = initializeStudiesValuesArray(
    tableColumnTitlesArray
  );

  cellsArray.forEach((element, index, array) => {
    if (index >= numberOfColumns) {
      if (element.title["$t"].match(/([A-z]+)/g) == studyTitleLetter) {
        tempStudyTitle = element.content["$t"].trim();
      }

      if (element.title["$t"].match(/([A-z]+)/g) == studyCountryLetter) {
        element.content["$t"].split(valueSeparator).forEach((cellValue) => {
          tempStudyCountriesArray.push(cellValue.trim());
        });
      }

      if (element.title["$t"].match(/([A-z]+)/g) == studyLinkLetter) {
        tempStudyLink = element.content["$t"].trim();
      }

      filtersBlockArray.forEach((item, index) => {
        if (element.title["$t"].match(/([A-z]+)/g) == item.letter) {
          element.content["$t"].split(valueSeparator).forEach((cellValue) => {
            tempFiltersBlockArray.forEach((filterItem) => {
              if (filterItem.title == item.title.trim()) {
                filterItem.values.push(cellValue.trim());
              }
            });
          });
        }
      });

      tableColumnTitlesArray.forEach((item, index) => {
        if (element.title["$t"].match(/([A-z]+)/g) == item.letter) {
          element.content["$t"].split(valueSeparator).forEach((cellValue) => {
            temptableColumnTitlesArray.forEach((columnItem) => {
              if (columnItem.title == item.title.trim()) {
                columnItem.values.push(cellValue.trim());
              }
            });
          });
        }
      });

      if (
        typeof array[index + 1] === "undefined" ||
        array[index].title["$t"] > array[index + 1].title["$t"]
      ) {
        // If study has title and country - add it to array
        if (tempStudyTitle.length > 0 && tempStudyCountriesArray.length > 0) {
          let tempObj = {
            studyTitle: tempStudyTitle,
            studyLink: tempStudyLink,
            studyCountriesArray: tempStudyCountriesArray,
            tableColumns: temptableColumnTitlesArray,
            filterBlock: tempFiltersBlockArray,
          };
          studiesArray.push(tempObj);

          tempStudyTitle = "";
          tempStudyLink = "";
          tempStudyCountriesArray = [];
          temptableColumnTitlesArray = initializeStudiesValuesArray(
            tableColumnTitlesArray
          );
          tempFiltersBlockArray = initializeStudiesValuesArray(
            filtersBlockArray
          );
        } else {
          tempStudyTitle = "";
          tempStudyLink = "";
          tempStudyCountriesArray = [];
          temptableColumnTitlesArray = initializeStudiesValuesArray(
            tableColumnTitlesArray
          );
          tempFiltersBlockArray = initializeStudiesValuesArray(
            filtersBlockArray
          );
        }
      }
    }
  });

  return studiesArray;
}

function getFilteredStudiesArray(
  studiesArray,
  filtersValuesFromFilterBlockArray
) {
  let resultArray = studiesArray.filter((study) => {
    let isAllFiltersMatchesFlagArray = [];

    study.filterBlock.forEach((studyFilter) => {
      let isAtLeastOneFilterValueMatch = false;
      filtersValuesFromFilterBlockArray.forEach((fblockFilter) => {
        if (studyFilter.title == fblockFilter.title) {
          if (
            fblockFilter.values.length == 0 &&
            studyFilter.values.length == 0
          ) {
            //if no filter value is selected and no study filter value exists
            isAtLeastOneFilterValueMatch = true;
          } else if (
            fblockFilter.values.length == 0 &&
            studyFilter.values.length > 0
          ) {
            //if no filter value is selected and study filter values exist
            isAtLeastOneFilterValueMatch = true;
          } else if (
            fblockFilter.values.length > 0 &&
            studyFilter.values.length == 0
          ) {
            //if filter value is selected but no study filter value exists
            isAtLeastOneFilterValueMatch = false;
          } else {
            studyFilter.values.forEach((studyFilterValue) => {
              fblockFilter.values.forEach((fblockFilterValue) => {
                if (studyFilterValue == fblockFilterValue) {
                  isAtLeastOneFilterValueMatch = true;
                }
              });
            });
          }
        }
      });

      isAllFiltersMatchesFlagArray.push(isAtLeastOneFilterValueMatch);
    });

    if (isAllFiltersMatchesFlagArray.indexOf(false) === -1) {
      return true;
    }
  });

  return resultArray;
}

function getValuesForFiltersArray(studiesArray, filtersBlockArray) {
  let filtersValuesFromSheetArray = initializeStudiesValuesArray(
    filtersBlockArray
  );

  // Create array with all filters values
  studiesArray.forEach((study, index, array) => {
    study.filterBlock.forEach((studyFilterItem, indexOfblockFilter) => {
      studyFilterItem.values.forEach((studyFilterItemValue) => {
        filtersValuesFromSheetArray.forEach((filterArrayTemp) => {
          if (filterArrayTemp.title == studyFilterItem.title) {
            if (filterArrayTemp.values.indexOf(studyFilterItemValue) === -1) {
              filterArrayTemp.values.push(studyFilterItemValue.trim());
            }
          }
        });
      });
    });
  });

  return filtersValuesFromSheetArray;
}

function getValuesFromFilterBlock(filtersBlockArray, filterSelectClass) {
  let resultArray = initializeStudiesValuesArray(filtersBlockArray);
  let filterList = document.querySelectorAll(`.${filterSelectClass}`);

  filterList.forEach((filterNode) => {
    document
      .querySelectorAll(`#${filterNode.id}_itemList ul li`)
      .forEach(function (item) {
        resultArray.forEach((filtersValuesItem) => {
          if (item.classList.contains("active")) {
            if (filterNode.name == filtersValuesItem.title) {
              filtersValuesItem.values.push(
                item
                  .querySelector(".multiselect-checkbox")
                  .getAttribute("data-val")
              );
            }
          }
        });
      });
  });

  return resultArray;
}

function createTableComponent(
  mainComponentId,
  tableId,
  exportToCSVButtonId,
  studiesArray,
  tableColumnTitlesArray,
  studyTitleLetter
) {
  // Add export button for table
  let tableButtonWrapper = document.createElement("div");
  tableButtonWrapper.classList.add("table-button-block-wrapper");
  tableButtonWrapper.id = mainComponentId + "-table-button-block-wrapper";
  tableButtonWrapper.setAttribute(
    "style",
    "display: flex; align-items: center; justify-content: flex-end; "
  );

  document.getElementById(mainComponentId).append(tableButtonWrapper);

  let tableWrapperBlockButtonElement = document.createElement("div");
  tableWrapperBlockButtonElement.classList.add("wp-block-button");
  tableWrapperBlockButtonElement.classList.add("export-table-btn");
  tableButtonWrapper.append(tableWrapperBlockButtonElement);

  let tableWrapperBlockButtonLinkElement = document.createElement("a");
  tableWrapperBlockButtonLinkElement.id = exportToCSVButtonId;
  tableWrapperBlockButtonLinkElement.classList.add("wp-block-button__link");
  tableWrapperBlockButtonLinkElement.classList.add("has-background");
  tableWrapperBlockButtonLinkElement.classList.add(
    "has-luminous-vivid-orange-background-color"
  );
  tableWrapperBlockButtonLinkElement.innerHTML = "Export to CSV";
  tableWrapperBlockButtonElement.append(tableWrapperBlockButtonLinkElement);

  const tableContentId = tableId + "-content";
  const tablePaginationBlockId = tableId + "-pagination-block";

  let tableWrapperElement = document.createElement("div");
  tableWrapperElement.classList.add("world-map-table-block");
  tableWrapperElement.id = tableId + "-container";
  document.getElementById(mainComponentId).append(tableWrapperElement);

  let tableElement = document.createElement("table");
  tableElement.classList.add("world-map-table");
  tableElement.classList.add("table-to-paginate");
  tableElement.id = tableId;
  tableWrapperElement.append(tableElement);

  let tablePaginationBlockElement = document.createElement("ul");
  tablePaginationBlockElement.classList.add("pagination-block");
  tablePaginationBlockElement.classList.add("pager");
  tablePaginationBlockElement.setAttribute(
    "style",
    "display: flex; flex-wrap: wrap;"
  );
  tablePaginationBlockElement.id = tablePaginationBlockId;
  document.getElementById(mainComponentId).append(tablePaginationBlockElement);

  let tHeadTableElement = document.createElement("thead");
  tHeadTableElement.classList.add("world-map-table-header");
  tableElement.append(tHeadTableElement);

  let tBodyTableElement = document.createElement("tbody");
  tBodyTableElement.classList.add("world-map-table-content");
  tBodyTableElement.setAttribute(
    "style",
    "text-align: center; font-weight: normal !important"
  );
  tBodyTableElement.id = tableContentId;
  tableElement.append(tBodyTableElement);

  //Fill in table header
  let tableRowElement = document.createElement("tr");
  tHeadTableElement.append(tableRowElement);
  tableColumnTitlesArray.forEach((tableColumnItem) => {
    let th = document.createElement("th");
    th.innerHTML = tableColumnItem.title;
    tableRowElement.append(th);
  });

  studiesArray.forEach((study) => {
    let tableRowElement = document.createElement("tr");
    tBodyTableElement.append(tableRowElement);

    study.tableColumns.forEach((studyTableColumn) => {
      if (studyTableColumn.letter == studyTitleLetter) {
        let th = document.createElement("th");
        th.innerHTML = getTitleAsHTML(
          studyTableColumn.values[0],
          study.studyLink
        );
        tableRowElement.append(th);
      }

      tableColumnTitlesArray.forEach((tableColumnTitleItem) => {
        if (
          studyTableColumn.letter == tableColumnTitleItem.letter &&
          studyTableColumn.letter != studyTitleLetter
        ) {
          let th = document.createElement("th");
          th.innerHTML = studyTableColumn.values.join(", ");
          tableRowElement.append(th);
        }
      });
    });
  });

  addPaginationToTable(tableContentId, tablePaginationBlockId);

  //to clear eventlistners
  var old_element = document.getElementById(exportToCSVButtonId);
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);

  document
    .getElementById(exportToCSVButtonId)
    .addEventListener("click", function () {
      downloadCSV(tableId, "world-map-data.csv");
    });
}

function getTitleAsHTML(title, link) {
  if (typeof link === "string" && link.length > 0) {
    return `<a href="${link}" target="_blank"> ${title} </a>`;
  } else {
    return title;
  }
}

function createWorldMapComponent(
  mainComponentId,
  chartContainerId,
  updateButtonId,
  studiesArray,
  filtersValuesFromFilterBlockArray,
  studyCountryLetter,
  filterSelectClass,
  filtersBlockArray
) {
  //If "world-map-block" exists - remove it
  var mapElement = document.getElementById(
    mainComponentId + "-world-map-block"
  );
  if (typeof mapElement != "undefined" && mapElement != null) {
    mapElement.parentNode.removeChild(mapElement);
  }

  // Create world-map-block element
  let worldMapChartWrapperElement = document.createElement("div");
  worldMapChartWrapperElement.classList.add("world-map-block");
  worldMapChartWrapperElement.id = mainComponentId + "-world-map-block";

  let worldMapChartElement = document.createElement("div");
  worldMapChartElement.id = chartContainerId;
  worldMapChartWrapperElement.append(worldMapChartElement);

  document.getElementById(mainComponentId).append(worldMapChartWrapperElement);

  let isAtLeastOneCountrySelectedInFilter = false;

  // Check if filter column letter from sheet is equal to country column letter
  if (filtersValuesFromFilterBlockArray) {
    filtersValuesFromFilterBlockArray.forEach((filteredItem) => {
      if (
        filteredItem.letter == studyCountryLetter &&
        filteredItem.values.length > 0
      ) {
        isAtLeastOneCountrySelectedInFilter = true;
      }
    });
  }

  // create array of countries
  let tempCountriesForMapArray = [];
  studiesArray.forEach((study) => {
    study.studyCountriesArray.forEach((countryTitle) => {
      if (isAtLeastOneCountrySelectedInFilter) {
        filtersValuesFromFilterBlockArray.forEach((filteredItem) => {
          if (filteredItem.letter == studyCountryLetter) {
            filteredItem.values.forEach((filteredValue) => {
              if (countryTitle == filteredValue) {
                tempCountriesForMapArray.push(countryTitle);
              }
            });
          }
        });
      } else {
        tempCountriesForMapArray.push(countryTitle);
      }
    });
  });

  // count countries
  tempArray = tempCountriesForMapArray.reduce(function (accumulator, el) {
    accumulator[el] = (accumulator[el] || 0) + 1;
    return accumulator;
  }, {});

  //get countries short codes
  let objCountriesAndNumbers = [];
  for (prop in tempArray) {
    countryName = getCountryName(prop);
    if (countryName) {
      objCountriesAndNumbers.push([countryName, tempArray[prop]]);
    }
  }

  var worldMapHighchart = Highcharts.mapChart(chartContainerId, {
    chart: {
      map: "custom/world-eckert3",
    },
    title: {
      text: "",
    },
    mapNavigation: {
      enabled: true,
      enableMouseWheelZoom: false,
      buttonOptions: {
        verticalAlign: "bottom",
      },
    },
    colorAxis: {
      min: 0,
    },

    series: [
      {
        data: objCountriesAndNumbers,
        name: "Number of studies",
        states: {
          hover: {
            color: "#BADA55",
          },
        },
        dataLabels: {
          enabled: true,
          format: "{point.name}",
        },
      },
    ],
  });
}

function createFiltersBlockComponent(
  mainComponentId,
  filterWrapperBlockId,
  updateButtonId,
  filterSelectClass,
  filtersBlockArray,
  filtersValuesFromSheetArray
) {
  let updateButtonWrapper = document.createElement("div");
  updateButtonWrapper.classList.add("filter-button-block-wrapper");
  updateButtonWrapper.setAttribute(
    "style",
    "display: flex; align-items: center; justify-content: center; "
  );

  document.getElementById(mainComponentId).prepend(updateButtonWrapper);

  // Add update button for filters
  let filterWrapperBlockButtonElement = document.createElement("div");
  filterWrapperBlockButtonElement.classList.add("wp-block-button");
  filterWrapperBlockButtonElement.classList.add("custom-filter-btn");
  updateButtonWrapper.append(filterWrapperBlockButtonElement);

  // Id of this element is used in another place too
  let filterWrapperBlockButtonLinkElement = document.createElement("a");
  filterWrapperBlockButtonLinkElement.id = updateButtonId;
  filterWrapperBlockButtonLinkElement.classList.add("wp-block-button__link");
  filterWrapperBlockButtonLinkElement.classList.add("has-background");
  filterWrapperBlockButtonLinkElement.classList.add(
    "has-luminous-vivid-orange-background-color"
  );
  filterWrapperBlockButtonLinkElement.innerHTML = "Explore";
  filterWrapperBlockButtonElement.append(filterWrapperBlockButtonLinkElement);

  // Add filters' block element
  let filterWrapperBlockElement = document.createElement("div");
  filterWrapperBlockElement.classList.add("filter-wrapper-block");
  filterWrapperBlockElement.id = filterWrapperBlockId;
  document.getElementById(mainComponentId).prepend(filterWrapperBlockElement);

  filtersBlockArray.forEach((filtersBlockArrayItem, indexOfblockFilter) => {
    // Add filters' wrapper element
    let filterWrapperElement = document.createElement("div");
    filterWrapperElement.classList.add("filter-wrapper");
    filterWrapperElement.id =
      mainComponentId +
      "-filter-wrapper-" +
      filtersBlockArrayItem.title.replace(/\W/g, "_");
    filterWrapperElement.setAttribute(
      "style",
      "display: flex; align-items: center; padding: 1em"
    );
    filterWrapperBlockElement.append(filterWrapperElement);

    // Add title of filter
    let filterTitleElement = document.createElement("div");
    filterTitleElement.innerHTML = filtersBlockArrayItem.title;
    filterTitleElement.setAttribute("style", "padding: 0 1em");
    filterWrapperElement.append(filterTitleElement);

    // Add select to filter
    let filterSelectElement = document.createElement("select");
    filterSelectElement.id =
      mainComponentId +
      "-visualization-filter-" +
      filtersBlockArrayItem.title.replace(/\W/g, "_");
    filterSelectElement.name = filtersBlockArrayItem.title;
    filterSelectElement.classList.add(filterSelectClass);
    filterSelectElement.setAttribute("style", "margin: 1rem 2rem 1rem 0");
    filterSelectElement.setAttribute("multiple", "");
    filterWrapperElement.append(filterSelectElement);

    // Add default options to select

    filtersBlockArrayItem.defaultValues.forEach((defaultFilterValue) => {
      let filterSelectOptionElement = document.createElement("option");
      filterSelectOptionElement.innerHTML = defaultFilterValue;
      filterSelectOptionElement.setAttribute("value", defaultFilterValue);
      filterSelectElement.append(filterSelectOptionElement);
    });

    // Add unique filter's values from google sheet
    filtersValuesFromSheetArray.forEach((filtersValuesFromSheetArrayItem) => {
      if (
        filtersBlockArrayItem.title == filtersValuesFromSheetArrayItem.title
      ) {
        filtersValuesFromSheetArrayItem.values.forEach((filterValue) => {
          let isValueAlreadyAdded = false;
          Object.values(filterSelectElement.options).forEach(
            (existedOptionValue) => {
              if (existedOptionValue.innerHTML == filterValue.trim()) {
                isValueAlreadyAdded = true;
              }
            }
          );

          if (!isValueAlreadyAdded && filterValue) {
            let filterSelectOptionElement = document.createElement("option");
            filterSelectOptionElement.innerHTML = filterValue;
            filterSelectOptionElement.setAttribute("value", filterValue);
            filterSelectElement.append(filterSelectOptionElement);
          }
        });
      }
    });
  });

  // Add multiselection to filters
  let filterList = document.querySelectorAll(`.${filterSelectClass}`);
  filterList.forEach((filterNode) => {
    document.multiselect(`#${filterNode.id}`);
  });
}

function initializeStudiesValuesArray(filtersBlockArray) {
  let tempFiltersBlockArray = [];
  filtersBlockArray.forEach((item, index) => {
    let tempObj = {
      title: item.title.trim(),
      letter: item.letter,
      values: [],
    };
    tempFiltersBlockArray.push(tempObj);
  });
  return tempFiltersBlockArray;
}

function addPaginationToTable(tableElementId, paginationBlockElementId) {
  $.fn.generatePagination = generatePagination;

  $("#" + tableElementId).generatePagination({
    pagerSelector: "#" + paginationBlockElementId,
    activeColor: "orange",
    prevText: "Prev",
    nextText: "Next",
    showPrevNext: true,
    hidePageNumbers: false,
    perPage: 8,
  });
}

function getCountryName(countryName) {
  let isoCountries = {
    AF: "Afghanistan",
    AX: "Aland Islands",
    AL: "Albania",
    DZ: "Algeria",
    AS: "American Samoa",
    AD: "Andorra",
    AO: "Angola",
    AI: "Anguilla",
    AQ: "Antarctica",
    AG: "Antigua And Barbuda",
    AR: "Argentina",
    AM: "Armenia",
    AW: "Aruba",
    AU: "Australia",
    AT: "Austria",
    AZ: "Azerbaijan",
    BS: "Bahamas",
    BH: "Bahrain",
    BD: "Bangladesh",
    BB: "Barbados",
    BY: "Belarus",
    BE: "Belgium",
    BZ: "Belize",
    BJ: "Benin",
    BM: "Bermuda",
    BT: "Bhutan",
    BO: "Bolivia",
    BA: "Bosnia And Herzegovina",
    BW: "Botswana",
    BV: "Bouvet Island",
    BR: "Brazil",
    IO: "British Indian Ocean Territory",
    BN: "Brunei Darussalam",
    BG: "Bulgaria",
    BF: "Burkina Faso",
    BI: "Burundi",
    KH: "Cambodia",
    CM: "Cameroon",
    CA: "Canada",
    CV: "Cape Verde",
    KY: "Cayman Islands",
    CF: "Central African Republic",
    TD: "Chad",
    CL: "Chile",
    CN: "China",
    CX: "Christmas Island",
    CC: "Cocos (Keeling) Islands",
    CO: "Colombia",
    KM: "Comoros",
    CG: "Congo",
    CD: "Congo, Democratic Republic",
    CK: "Cook Islands",
    CR: "Costa Rica",
    CI: "Cote D'Ivoire",
    HR: "Croatia",
    CU: "Cuba",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DK: "Denmark",
    DJ: "Djibouti",
    DM: "Dominica",
    DO: "Dominican Republic",
    EC: "Ecuador",
    EG: "Egypt",
    SV: "El Salvador",
    GQ: "Equatorial Guinea",
    ER: "Eritrea",
    EE: "Estonia",
    ET: "Ethiopia",
    FK: "Falkland Islands (Malvinas)",
    FO: "Faroe Islands",
    FJ: "Fiji",
    FI: "Finland",
    FR: "France",
    GF: "French Guiana",
    PF: "French Polynesia",
    TF: "French Southern Territories",
    GA: "Gabon",
    GM: "Gambia",
    GE: "Georgia",
    DE: "Germany",
    GH: "Ghana",
    GI: "Gibraltar",
    GR: "Greece",
    GL: "Greenland",
    GD: "Grenada",
    GP: "Guadeloupe",
    GU: "Guam",
    GT: "Guatemala",
    GG: "Guernsey",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HT: "Haiti",
    HM: "Heard Island & Mcdonald Islands",
    VA: "Holy See (Vatican City State)",
    HN: "Honduras",
    HK: "Hong Kong",
    HU: "Hungary",
    IS: "Iceland",
    IN: "India",
    ID: "Indonesia",
    IR: "Iran, Islamic Republic Of",
    IQ: "Iraq",
    IE: "Ireland",
    IM: "Isle Of Man",
    IL: "Israel",
    IT: "Italy",
    JM: "Jamaica",
    JP: "Japan",
    JE: "Jersey",
    JO: "Jordan",
    KZ: "Kazakhstan",
    KE: "Kenya",
    KI: "Kiribati",
    KR: "Korea",
    KW: "Kuwait",
    KG: "Kyrgyzstan",
    LA: "Lao People's Democratic Republic",
    LV: "Latvia",
    LB: "Lebanon",
    LS: "Lesotho",
    LR: "Liberia",
    LY: "Libyan Arab Jamahiriya",
    LI: "Liechtenstein",
    LT: "Lithuania",
    LU: "Luxembourg",
    MO: "Macao",
    MK: "Macedonia",
    MG: "Madagascar",
    MW: "Malawi",
    MY: "Malaysia",
    MV: "Maldives",
    ML: "Mali",
    MT: "Malta",
    MH: "Marshall Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MU: "Mauritius",
    YT: "Mayotte",
    MX: "Mexico",
    FM: "Micronesia, Federated States Of",
    MD: "Moldova",
    MC: "Monaco",
    MN: "Mongolia",
    ME: "Montenegro",
    MS: "Montserrat",
    MA: "Morocco",
    MZ: "Mozambique",
    MM: "Myanmar",
    NA: "Namibia",
    NR: "Nauru",
    NP: "Nepal",
    NL: "Netherlands",
    AN: "Netherlands Antilles",
    NC: "New Caledonia",
    NZ: "New Zealand",
    NI: "Nicaragua",
    NE: "Niger",
    NG: "Nigeria",
    NU: "Niue",
    NF: "Norfolk Island",
    MP: "Northern Mariana Islands",
    NO: "Norway",
    OM: "Oman",
    PK: "Pakistan",
    PW: "Palau",
    PS: "Palestinian Territory, Occupied",
    PA: "Panama",
    PG: "Papua New Guinea",
    PY: "Paraguay",
    PE: "Peru",
    PH: "Philippines",
    PN: "Pitcairn",
    PL: "Poland",
    PT: "Portugal",
    PR: "Puerto Rico",
    QA: "Qatar",
    RE: "Reunion",
    RO: "Romania",
    RU: "Russian Federation",
    RW: "Rwanda",
    BL: "Saint Barthelemy",
    SH: "Saint Helena",
    KN: "Saint Kitts And Nevis",
    LC: "Saint Lucia",
    MF: "Saint Martin",
    PM: "Saint Pierre And Miquelon",
    VC: "Saint Vincent And Grenadines",
    WS: "Samoa",
    SM: "San Marino",
    ST: "Sao Tome And Principe",
    SA: "Saudi Arabia",
    SN: "Senegal",
    RS: "Serbia",
    SC: "Seychelles",
    SL: "Sierra Leone",
    SG: "Singapore",
    SK: "Slovakia",
    SI: "Slovenia",
    SB: "Solomon Islands",
    SO: "Somalia",
    ZA: "South Africa",
    GS: "South Georgia And Sandwich Isl.",
    ES: "Spain",
    LK: "Sri Lanka",
    SD: "Sudan",
    SR: "Suriname",
    SJ: "Svalbard And Jan Mayen",
    SZ: "Swaziland",
    SE: "Sweden",
    CH: "Switzerland",
    SY: "Syrian Arab Republic",
    TW: "Taiwan",
    TJ: "Tajikistan",
    TZ: "Tanzania",
    TH: "Thailand",
    TL: "Timor-Leste",
    TG: "Togo",
    TK: "Tokelau",
    TO: "Tonga",
    TT: "Trinidad And Tobago",
    TN: "Tunisia",
    TR: "Turkey",
    TM: "Turkmenistan",
    TC: "Turks And Caicos Islands",
    TV: "Tuvalu",
    UG: "Uganda",
    UA: "Ukraine",
    AE: "United Arab Emirates",
    GB: "United Kingdom",
    US: "United States",
    UM: "United States Outlying Islands",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VU: "Vanuatu",
    VE: "Venezuela",
    VN: "Viet Nam",
    VG: "Virgin Islands, British",
    VI: "Virgin Islands, U.S.",
    WF: "Wallis And Futuna",
    EH: "Western Sahara",
    YE: "Yemen",
    ZM: "Zambia",
    ZW: "Zimbabwe",
  };

  if (countryName == "Côte d'Ivoire") countryName = "Cote D'Ivoire";

  for (let countryCode in isoCountries) {
    if (isoCountries[countryCode] == countryName) {
      return countryCode.toLocaleLowerCase();
    }
  }
}

function getNumberOfColumns(array) {
  let i = 0;
  let numberOfColumns = 0;
  for (let cell of array) {
    if (array[i + 1] && array[i].title["$t"] > array[i + 1].title["$t"]) {
      numberOfColumns++;
      break;
    } else {
      numberOfColumns++;
      i++;
    }
  }

  return numberOfColumns;
}

function makeTableVisible(bool, tableId) {
  const table = document.getElementById(tableId + "-container");
  const tablePaginationBlock = document.getElementById(
    tableId + "-pagination-block"
  );
  if (bool) {
    table.style.display = "block";
    tablePaginationBlock.style.display = "flex";
  } else {
    table.style.display = "none";
    tablePaginationBlock.style.display = "none";
  }
}

function highlightFilter() {
  let url_str = window.location.href;
  let url = new URL(url_str);
  let search_params = url.searchParams;

  let highlightId = search_params.get("highlightId");

  if (highlightId) {
    document.getElementById(highlightId).style.background = "#ff690036";
  }
}

function generatePagination(opts) {
  //https://xdsoft.net/jquery-plugins/pageme/

  var $this = this,
    defaults = {
      activeColor: "blue",
      perPage: 10,
      showPrevNext: false,
      nextText: "",
      prevText: "",
      hidePageNumbers: false,
    },
    settings = $.extend(defaults, opts);

  var listElement = $this;
  var perPage = settings.perPage;
  var children = listElement.children();
  var pager = $(".pager");

  if (typeof settings.childSelector != "undefined") {
    children = listElement.find(settings.childSelector);
  }

  if (typeof settings.pagerSelector != "undefined") {
    pager = $(settings.pagerSelector);
  }

  var numItems = children.length;
  var numPages = Math.ceil(numItems / perPage);

  $("#total_reg").html(numItems + " Entries In Total");

  pager.data("curr", 0);

  if (settings.showPrevNext) {
    $(
      '<li><a href="#" class="prev_link" title="' +
        settings.prevText +
        '"><i class="material-icons">chevron_left</i></a></li>'
    ).appendTo(pager);
  }

  var curr = 0;
  while (numPages > curr && settings.hidePageNumbers == false) {
    $(
      '<li class="waves-effect"><a href="#" class="page_link">' +
        (curr + 1) +
        "</a></li>"
    ).appendTo(pager);
    curr++;
  }

  if (settings.showPrevNext) {
    $(
      '<li><a href="#" class="next_link"  title="' +
        settings.nextText +
        '"><i class="material-icons">chevron_right</i></a></li>'
    ).appendTo(pager);
  }

  pager.find(".page_link:first").addClass("active");
  pager.find(".prev_link").hide();
  if (numPages <= 1) {
    pager.find(".next_link").hide();
  }
  pager
    .children()
    .eq(1)
    .addClass("active " + settings.activeColor);

  children.hide();
  children.slice(0, perPage).show();

  pager.find("li .page_link").click(function () {
    var clickedPage = $(this).html().valueOf() - 1;
    goTo(clickedPage, perPage);
    return false;
  });
  pager.find("li .prev_link").click(function () {
    previous();
    return false;
  });
  pager.find("li .next_link").click(function () {
    next();
    return false;
  });

  function previous() {
    var goToPage = parseInt(pager.data("curr")) - 1;
    goTo(goToPage);
  }

  function next() {
    goToPage = parseInt(pager.data("curr")) + 1;
    goTo(goToPage);
  }

  function goTo(page) {
    var startAt = page * perPage,
      endOn = startAt + perPage;

    children.css("display", "none").slice(startAt, endOn).show();

    if (page >= 1) {
      pager.find(".prev_link").show();
    } else {
      pager.find(".prev_link").hide();
    }

    if (page < numPages - 1) {
      pager.find(".next_link").show();
    } else {
      pager.find(".next_link").hide();
    }

    pager.data("curr", page);
    pager.children().removeClass("active " + settings.activeColor);
    pager
      .children()
      .eq(page + 1)
      .addClass("active " + settings.activeColor);
  }
}

function downloadCSV(tableId, filename) {
  let csvRows = [];
  let rows = document.querySelectorAll("#" + tableId + " tr");

  for (let i = 0; i < rows.length; i++) {
    let row = [],
      cols = rows[i].querySelectorAll("td, th");

    for (let j = 0; j < cols.length; j++) {
      row.push(cols[j].innerText.replace(/"/g, "`"));
    }

    csvRows.push(row);
  }

  exportToCsv(filename, csvRows);
}

function exportToCsv(filename, rows) {
  var processRow = function (row) {
    var finalVal = "";
    for (var j = 0; j < row.length; j++) {
      var innerValue = row[j] === null ? "" : row[j].toString();
      if (row[j] instanceof Date) {
        innerValue = row[j].toLocaleString();
      }
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ",";
      finalVal += result;
    }
    return finalVal + "\n";
  };

  var csvFile = "";
  for (var i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  var blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
