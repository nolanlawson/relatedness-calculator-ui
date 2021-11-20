(function ($) {
  var queryUrl = 'https://lblc7q3pm2.execute-api.us-west-2.amazonaws.com/RelatednessCalculator'
  var autosuggestUrl = 'https://4j4856b684.execute-api.us-west-2.amazonaws.com/RelatednessCalculatorAutosuggester'
  var autosuggestInput = $("#autosuggest-input");
  var resultDiv = $('#result');
  var explanation = $('#explanation');
  var spinner = $('#spinner');
  var explanationParagraph = $('#explanation-paragraph');
  var form = $('.the-main-form');
  var params = Object.fromEntries(new URLSearchParams(location.search));
  var result;

  function drawCanviz(actualGraphWidth, graph) {
    var canviz = new Canviz('graph_container');
    // fudge factor of 40 for margins on both side (which should only be 8, but whatever)
    var canvasWidth = document.getElementById('page-body').offsetWidth - (40);
    // canviz automatically scales everything to 96/72
    var graphWidth = actualGraphWidth * 96 / 72;
    // use 0.9 as a nice default graph size
    var scale = graphWidth > canvasWidth ? canvasWidth / graphWidth : 0.9;
    canviz.setScale(scale);
    canviz.parse(graph);
  }

  function render() {
    explanation.css({
      display: (result && !result.failed) ? '' : 'none'
    })

    if (result) {
      var html = ''
      if (result.failed) {
        if (result.parseError) {
          html += '<img alt="info" class="info-icon" src="images/get-info.png" width="32" height="32">'
          if (result.parseError === 'Ambiguity') {
            html += `
            <p>
              <strong>${params.q}</strong> is ambiguous. <strong>It can mean...</strong>
            </p>
            <p>
              <ul>
                ${
              result.alternateQueries.map(it => `<li><a href="?q=${encodeURIComponent(it)}">${it}</a></li>`).join('\n')
            }
              </ul>
            </p>`
          } else if (result.parseError === 'StepRelation') {
            html += '<p>You are not biologically related to <strong>in-laws</strong> and <strong>step-relations</strong>.</p>'
          }
        } else {
          html += `<img alt="frowny face" class="info-icon" src="images/frown-icon.png" width="32" height="32"/>
          <p>Whoops! Nothing found for <strong> ${params.q}</strong>. Could you try re-phrasing it?</p>
          <p>(Error: ${result.errorMessage})</p>`
        }
      } else { // didn't fail

        explanationParagraph.html(`
            So, your <strong>${params.q.toLowerCase().trim()}</strong>
            is <strong>${(result.coefficient * 100).toLocaleString(undefined, {minimumFractionDigits: 0})}%</strong> related to
            you
            and <strong>${result.degree}</strong> ${result.degree > 1 ? 'steps' : 'step'} removed from you in your family
            tree.</strong>
          `)

        html += `<p>Result for <strong> ${params.q}</strong>
          <br />Relatedness coefficient: <b>${(result.coefficient * 100).toLocaleString(undefined, {minimumFractionDigits: 0})}%</b>
          <br />Degree of relation: <b>${result.degree}</b>
          </p>
          <br />`

        drawCanviz(result.graphWidth, result.graph);
      }
      resultDiv.html(html)
    }
  }

  // Show spinner, send ajax request
  if (params.q) {
    spinner.css({display: ''})
    $.ajax({
      url: queryUrl,
      data: {q: params.q},
      dataType: "json",
      success: function (data) {
        result = data
        render()
        spinner.css({display: 'none'})
      },
      error: function (err) {
        spinner.css({display: 'none'})
        console.log(err);
      }
    })

    if (params.example !== 'true') {
      autosuggestInput.val(params.q);
    }
  }

  // Autosuggestion
  autosuggestInput.autocomplete({
    source: function (request, cb) {
      $.ajax({
        url: autosuggestUrl,
        data: {q: request.term},
        dataType: "json",
        success: function (data) {
          cb(data.results);
        },
        error: function (err) {
          console.log(err);
        }
      });
    },
    minLength: 2,
    select: function () {
      setTimeout(function () {
        form.submit();
      });
    }
  });

  render()
})(jQuery);