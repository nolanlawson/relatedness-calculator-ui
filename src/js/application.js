"use strict";

(function ($) {
  var queryUrl = 'https://relatednesscalculatorapi.nolanlawson.com/RelatednessCalculator';
  var autosuggestUrl = 'https://relatednesscalculatorapi.nolanlawson.com/RelatednessCalculatorAutosuggester';
  var autosuggestInput = $("#autosuggest-input");
  var introText = $('#introductory-text');
  var resultDiv = $('#result');
  var explanation = $('#explanation');
  var spinner = $('#spinner');
  var explanationParagraph = $('#explanation-paragraph');
  var form = $('.the-main-form');
  var frownIcon = $('#frown-icon');
  var infoIcon = $('#info-icon');
  var params = deparam(location.search);
  var result;

  function deparam(str) {
    var params = new URLSearchParams(str);
    var res = {};
    params.forEach(function (value, key) {
      res[key] = value;
    });
    return res;
  }

  function drawCanviz(actualGraphWidth, graph) {
    var canviz = new Canviz('graph_container'); // fudge factor of 40 for margins on both side (which should only be 8, but whatever)

    var canvasWidth = document.getElementById('page-body').offsetWidth - 40; // canviz automatically scales everything to 96/72

    var graphWidth = actualGraphWidth * 96 / 72; // use 0.9 as a nice default graph size

    var scale = graphWidth > canvasWidth ? canvasWidth / graphWidth : 0.9;
    canviz.setScale(scale);
    canviz.parse(graph);
  }

  function render() {
    explanation.css({
      display: (result && !result.failed) ? '' : 'none'
    });

    if (result) {
      var html = '';

      if (result.failed) {
        if (result.parseError) {
          html += '<img alt="info" class="info-icon" src="' + infoIcon.attr('href') + '" width="32" height="32">';

          if (result.parseError === 'Ambiguity') {
            html += "<p><strong>"
              .concat(params.q, "</strong> is ambiguous. <strong>It can mean...</strong></p><p>  <ul>    ")
              .concat(result.alternateQueries.map(function (it) {
                return "<li><a href=\"?q=".concat(encodeURIComponent(it), "\">")
                  .concat(it, "</a></li>");
              }).join('\n'), "  </ul></p>");
          } else if (result.parseError === 'StepRelation') {
            html += '<p>You are not biologically related to <strong>in-laws</strong> and <strong>step-relations</strong>.</p>';
          }
        } else {
          html += "<img alt=\"frowny face\" class=\"info-icon\" src=\"" + frownIcon.attr('href') + "\" width=\"32\" height=\"32\"/><p>Whoops! Nothing found for <strong> "
            .concat(params.q, "</strong>. Could you try re-phrasing it?</p><p>(Error: ")
            .concat(result.errorMessage, ")</p>");
        }
      } else {
        // didn't fail
        explanationParagraph.html("So, your <strong>"
          .concat(result.cleanedQuery, "</strong> is <strong>")
          .concat((result.coefficient * 100).toLocaleString(undefined, {
            minimumFractionDigits: 0
          }), "%</strong> related to you and <strong>")
          .concat(result.degree, "</strong> ")
          .concat(result.degree > 1 ? 'steps' : 'step', " removed from you in your family tree.</strong>"));
        html += "<p>Result for <strong> "
          .concat(params.q, "</strong><br />Relatedness coefficient: <b>")
          .concat((result.coefficient * 100).toLocaleString(undefined, {
            minimumFractionDigits: 0
          }), "%</b><br />Degree of relation: <b>")
          .concat(result.degree, "</b></p><br />");
        drawCanviz(result.graphWidth, result.graph);
        document.title = result.cleanedQuery.substring(0, 1).toUpperCase() + result.cleanedQuery.substring(1) + ' - ' + document.title;
      }

      resultDiv.html(html);
    }
  } // Show spinner, send ajax request


  if (params.q) {
    spinner.css({
      display: ''
    });
    $.ajax({
      url: queryUrl,
      data: {
        q: params.q
      },
      dataType: "json",
      success: function success(data) {
        result = data;
        render();
        spinner.css({
          display: 'none'
        });
      },
      error: function error(err) {
        spinner.css({
          display: 'none'
        });
        console.log(err);
      }
    });

    if (params.example !== 'true') {
      autosuggestInput.val(params.q);
    }
  } // Autosuggestion


  autosuggestInput.autocomplete({
    source: function source(request, cb) {
      $.ajax({
        url: autosuggestUrl,
        data: {
          q: request.term
        },
        dataType: "json",
        success: function success(data) {
          cb(data.results);
        },
        error: function error(err) {
          console.log(err);
        }
      });
    },
    minLength: 2,
    select: function select() {
      setTimeout(function () {
        form.submit();
      });
    }
  });
  render();
})(jQuery);