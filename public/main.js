window.onload = () => {
    document.getElementById("generateForm").addEventListener('submit', (evt) => {
        evt.preventDefault();
    });
    document.getElementById("generateButton").addEventListener('click', async (evt) => {
        let fileId = document.getElementById("fileId").value;
        let accessToken = document.getElementById("figmaAccessToken").value;
        let ajax = new XMLHttpRequest();
        ajax.open("GET", `/data?fileId=${fileId}&figmaAccessToken=${accessToken}`, true);
        ajax.send();
        ajax.onreadystatechange = () => {
            if (ajax.readyState === 4 && ajax.responseText.status === 200) {
                document.getElementById("testResults").innerText = ajax.responseText;
            }
            else {
                document.getElementById("testResults").innerText = "Request Error!";
            }
        }
    });
};
