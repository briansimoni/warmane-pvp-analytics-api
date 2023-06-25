import { parseArenaStatistics } from "./client";

const html = `
<link
  href="/themes/warmane/assets/datatables/css/data-table.css"
  rel="stylesheet"
/>
<table id="data-table" class="stripe dataTable" width="100%">
  <thead>
    <tr>
      <th class="dt-left">Description</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody id="data-table-list">
    <tr>
      <td>Arenas won</td>
      <td class="dt-center">1377</td>
    </tr>
    <tr>
      <td>Arenas played</td>
      <td class="dt-center">2561</td>
    </tr>
    <tr>
      <td>5v5 matches</td>
      <td class="dt-center">1760</td>
    </tr>
    <tr>
      <td>5v5 victories</td>
      <td class="dt-center">905</td>
    </tr>
    <tr>
      <td>3v3 matches</td>
      <td class="dt-center">139</td>
    </tr>
    <tr>
      <td>3v3 victories</td>
      <td class="dt-center">80</td>
    </tr>
    <tr>
      <td>2v2 matches</td>
      <td class="dt-center">662</td>
    </tr>
    <tr>
      <td>2v2 victories</td>
      <td class="dt-center">392</td>
    </tr>
    <tr>
      <td>Circle of Blood matches</td>
      <td class="dt-center">2561</td>
    </tr>
    <tr>
      <td>Circle of Blood victories</td>
      <td class="dt-center">1377</td>
    </tr>
    <tr>
      <td>Dalaran Sewers matches</td>
      <td class="dt-center">2575</td>
    </tr>
    <tr>
      <td>Dalaran Sewers victories</td>
      <td class="dt-center">1386</td>
    </tr>
    <tr>
      <td>Ring of Trials matches</td>
      <td class="dt-center">2572</td>
    </tr>
    <tr>
      <td>Ring of Trials victories</td>
      <td class="dt-center">1341</td>
    </tr>
    <tr>
      <td>Ring of Valor matches</td>
      <td class="dt-center">4</td>
    </tr>
    <tr>
      <td>Ring of Valor victories</td>
      <td class="dt-center">1</td>
    </tr>
    <tr>
      <td>Ruins of Lordaeron matches</td>
      <td class="dt-center">2580</td>
    </tr>
    <tr>
      <td>Ruins of Lordaeron victories</td>
      <td class="dt-center">1396</td>
    </tr>
    <tr>
      <td>Highest 5 man personal rating</td>
      <td class="dt-center">2356</td>
    </tr>
    <tr>
      <td>Highest 3 man personal rating</td>
      <td class="dt-center">--</td>
    </tr>
    <tr>
      <td>Highest 2 man personal rating</td>
      <td class="dt-center">2205</td>
    </tr>
    <tr>
      <td>Highest 5 man team rating</td>
      <td class="dt-center">2356</td>
    </tr>
    <tr>
      <td>Highest 3 man team rating</td>
      <td class="dt-center">2036</td>
    </tr>
    <tr>
      <td>Highest 2 man team rating</td>
      <td class="dt-center">2277</td>
    </tr>
  </tbody>
</table>
<script>
  $.getScript("/themes/warmane/assets/datatables/js/jquery.dataTables.js").done(
    function () {
      $.getScript(
        "/themes/warmane/assets/datatables/js/dataTables.responsive.js"
      ).done(function () {
        if ($(".dataTable").length !== 0) {
          $(".dataTable").DataTable({
            bFilter: false,
            dom: '<"top">rt<"bottom"flp><"clear">',
            bPaginate: false,
            iDisplayLength: 2000,
            oLanguage: {
              sEmptyTable: "No results match your search criteria",
            },
            bLengthChange: false,
          });
        }
      });
    }
  );
</script>
`;

test("parseCharacterArenaStatistics", () => {
  const result = parseArenaStatistics(html);
  expect(result).toMatchObject({
    "Arenas won": 1377,
    "Ring of Valor victories": 1,
    "Highest 3 man personal rating": undefined,
  });
});
