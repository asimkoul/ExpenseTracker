function addNewExpense(e){
    e.preventDefault();

    const expenseDetails = {
        expenseamount: e.target.expenseamount.value,
        description: e.target.description.value,
        category: e.target.category.value,

    }
    console.log(expenseDetails)
    const token  = localStorage.getItem('token')
    axios.post('http://3.6.37.33:4000/expense/addexpense',expenseDetails,  { headers: {"Authorization" : token} })
        .then((response) => {

        addNewExpensetoUI(response.data.expense);

    }).catch(err => showError(err))

}

function showPremiumuserMessage() {
    document.getElementById('rzp-button1').style.visibility = "hidden"
    document.getElementById('message').innerHTML = "You are a premium user "
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

window.addEventListener('DOMContentLoaded', ()=> {
    const savedPageSize = localStorage.getItem('pageSize') || 5;
    document.getElementById('pageSize').value = savedPageSize;
    fetchExpense(1)
});

function addNewExpensetoUI(expense){
    const parentElement = document.getElementById('listOfExpenses');
    const expenseElemId = `expense-${expense.id}`;
    parentElement.innerHTML += `
        <li id=${expenseElemId}>
            ${expense.expenseamount} - ${expense.category} - ${expense.description}
            <button onclick='deleteExpense(event, ${expense.id})'>
                Delete Expense
            </button>
        </li>`
}

function deleteExpense(e, expenseid) {
    const token = localStorage.getItem('token')
    axios.delete(`http://3.6.37.33:4000/expense/deleteexpense/${expenseid}`,  { headers: {"Authorization" : token} }).then(() => {

            removeExpensefromUI(expenseid);

    }).catch((err => {
        showError(err);
    }))
}

function showError(err){
    document.body.innerHTML += `<div style="color:red;"> ${err}</div>`
}
function showLeaderboard(){
    const inputElement = document.createElement("input")
    inputElement.type = "button"
    inputElement.value = 'Show Leaderboard'
    inputElement.onclick = async() => {
        const token = localStorage.getItem('token')
        const userLeaderBoardArray = await axios.get('http://3.6.37.33:4000/premium/showLeaderBoard', { headers: {"Authorization" : token} })
        console.log(userLeaderBoardArray)

        var leaderboardElem = document.getElementById('leaderboard')
        leaderboardElem.innerHTML += '<h1> Leader Board </<h1>'
        userLeaderBoardArray.data.forEach((userDetails) => {
            leaderboardElem.innerHTML += `<li>Name - ${userDetails.name} Total Expense - ${userDetails.totalExpenses || 0} </li>`
        })
    }
    document.getElementById("message").appendChild(inputElement);

}

function removeExpensefromUI(expenseid){
    const expenseElemId = `expense-${expenseid}`;
    document.getElementById(expenseElemId).remove();
}

document.getElementById('rzp-button1').onclick = async function (e) {
    const token = localStorage.getItem('token')
    const response  = await axios.get('http://3.6.37.33:4000/purchase/premiummembership', { headers: {"Authorization" : token} });
    console.log(response);
    var options =
    {
     "key": response.data.key_id, // Enter the Key ID generated from the Dashboard
     "order_id": response.data.order.id,// For one time payment
     // This handler function will handle the success payment
     "handler": async function (response) {
        const res = await axios.post('http://3.6.37.33:4000/purchase/updatetransactionstatus',{
             order_id: options.order_id,
             payment_id: response.razorpay_payment_id,
         }, { headers: {"Authorization" : token} })
        
        console.log(res)
         alert('You are a Premium User Now')
         document.getElementById('rzp-button1').style.visibility = "hidden"
         document.getElementById('message').innerHTML = "You are a premium user "
         localStorage.setItem('token', res.data.token)
         showLeaderboard()
     },
  };
  const rzp1 = new Razorpay(options);
  rzp1.open();
  e.preventDefault();

  rzp1.on('payment.failed', function (response){
    console.log(response)
    alert('Something went wrong')
 });
}
function download(){
    const token  = localStorage.getItem('token')
    axios.get('http://3.6.37.33:4000/user/download', { headers: {"Authorization" : token} })
    .then((response) => {
        if(response.status === 200){
            //the bcakend is essentially sending a download link
            //  which if we open in browser, the file would download
            var a = document.createElement("a");
            a.href = response.data.fileUrl;
            a.download = 'myexpense.csv';
            a.click();
        } else {
            throw new Error(response.data.message)
        }

    })
    .catch((err) => {
        showError(err)
    });
}
function fetchExpense(page) {
    const pageSize= localStorage.getItem('pageSize') || 5 ;
    const token  = localStorage.getItem('token')
    const decodeToken = parseJwt(token)
    console.log(decodeToken)
    const ispremiumuser = decodeToken.ispremiumuser
    if(ispremiumuser){
        showPremiumuserMessage()
        showLeaderboard()
        displayRecords()

    }
    axios.get(`http://3.6.37.33:4000/expense/getexpenses?page=${page}&pageSize=${pageSize}`, { headers: {"Authorization" : token} })
    .then(response => {
        const expenseList = document.getElementById('listOfExpenses');
        expenseList.innerHTML = ''; // Clear existing list
            response.data.expenses.forEach(expense => {
                addNewExpensetoUI(expense);
            })
         
    
        const paginationDiv = document.getElementById('paginateExpense');
        paginationDiv.innerHTML = ''; // Clear existing pagination

        for (let i = 1; i <= response.data.totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === parseInt(page)) {
                pageButton.disabled = true; // Disable current page button
            }
            pageButton.onclick = () => fetchExpense(i);
            paginationDiv.appendChild(pageButton);
        }
    }).catch(err => {
        showError(err)
    })

}
function updatePageSize(){
    const pageSize = document.getElementById('pageSize').value;
    localStorage.setItem('pageSize' , pageSize)
    fetchExpense(1)
}

async function displayRecords() {
    try {
        document.getElementById('recordsDiv').style.display = 'block';
        const token = localStorage.getItem('token');
        const record = await axios.get('http://3.6.37.33:4000/user/downloadRecords', {
            headers: { 'Authorization': token }
        });
       
        document.getElementById('records').innerHTML = '';

        record.data.forEach(records => {
            const ul=document.getElementById('records')
            const li = document.createElement('li');
            li.textContent = `${records.downloadedAt} -` ;

            const dlink = document.createElement('a');
            dlink.href = records.url;
            dlink.textContent = 'Download';
            dlink.download = 'myexpense.csv';

            li.appendChild(dlink);
            ul.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        alert(error);
    }
}