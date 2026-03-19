// Supabase সেটআপ
const supabaseUrl = 'https://dnelzlyuhhxloysstnlg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZWx6bHl1aGh4bG95c3N0bmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM4MjAsImV4cCI6MjA4MTQyOTgyMH0.jYdJM1FTJja_A5CdTN3C3FWlKd_0E1JgHyaM4767SLc'

// ভেরিয়েবলের নাম 'supabaseClient' রাখা হয়েছে যাতে CDN এর সাথে কনফ্লিক্ট না হয়
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)
// সাইন আপ ফাংশন
async function signUp() {
    let email = document.querySelector('.input-email').value;
    let password = document.querySelector('.input-password').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    // Check if account already exists
    const { data: existingData, error: checkError } = await supabaseClient
        .from('atto')
        .select('*')
        .eq('acc', email + ':' + password);

    if (checkError) {
        alert('Error: ' + checkError.message);
        return;
    }

    if (existingData && existingData.length > 0) {
        alert('Account already exists with this email!');
        return;
    }

    // Insert new user record
    const { data, error } = await supabaseClient
        .from('atto')
        .insert([{ acc: email + ':' + password }]);

    if (error) {
        alert('Error creating account: ' + error.message);
    } else {
        // Save to localStorage
        localStorage.setItem('userAcc', email + ':' + password);
        alert('Sign up successful!');
        window.location.href = 'time.html';
    }
}
// সাইন ইন ফাংশন (localStorage সেটআপ ঠিক করা হয়েছে)
async function signIn() {
    let email = document.querySelector('.input-email1').value;
    let password = document.querySelector('.input-password1').value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    const { data, error } = await supabaseClient
        .from('atto')
        .select('*')
        .eq('acc', email + ':' + password);

    if (error) {
        alert('Error: ' + error.message);
    } else if (data && data.length > 0) {
        // সাইন ইন সফল হলে localStorage এ ডেটা সেভ করুন
        localStorage.setItem('userAcc', email + ':' + password); 
        alert('Sign in successful!');
        window.location.href = 'time.html';
    } else {
        alert('Invalid email or password');
    }
}

// টাইম রেকর্ড ফাংশন (সংশোধিত)
async function time() {
    let date = new Date();
    // toLocaleString এর বদলে toISOString ব্যবহার করুন
    let timeString = date.toISOString(); 
    let userAcc = localStorage.getItem('userAcc');

    const { data, error } = await supabaseClient
        .from('atto')
        .update({ time: timeString })
        .eq('acc', userAcc);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Timer started!');
    }
}

// সময় দেখানোর ফাংশন (সংশোধিত)
async function show() {
    let userAcc = localStorage.getItem('userAcc');
    if (!userAcc) return;

    const { data, error } = await supabaseClient
        .from('atto')
        .select('time')
        .eq('acc', userAcc)
        .single();

    if (error || !data || !data.time) {
        return;
    }

    let pastDate = new Date(data.time); 
    let now = new Date();

    let diffInMs = now - pastDate;

    // যদি সময় ভবিষ্যতে চলে যায় (ভুলবশত), তবে ০ দেখাবে
    if (diffInMs < 0) diffInMs = 0;

    let diffInSeconds = Math.floor(diffInMs / 1000);
    let diffInMinutes = Math.floor(diffInSeconds / 60);
    let diffInHours = Math.floor(diffInMinutes / 60);
    let diffInDays = Math.floor(diffInHours / 24);

    let displayElement = document.getElementById('time');

    if (diffInDays > 0) {
        displayElement.innerText = diffInDays + " day " + (diffInHours % 24) + " hour";
        const { error: updateError } = await supabaseClient
            .from('atto')
            .update({ day: diffInDays })
            .eq('acc', userAcc);
    } else if (diffInHours > 0) {
        displayElement.innerText = diffInHours + " hour " + (diffInMinutes % 60) + " minute";
    } else if (diffInMinutes > 0) {
        displayElement.innerText = diffInMinutes + " minute " + (diffInSeconds % 60) + " second";
    } else {
        displayElement.innerText = diffInSeconds + " second";
    }
}
setInterval(show, 1000);

async function coin() {   
    let userAcc = localStorage.getItem('userAcc');
    if (!userAcc) {
        return;
    }

    // আজকের তারিখ (YYYY-MM-DD ফরম্যাটে)
    let today = new Date().toISOString().split('T')[0];
    let lastCoinUpdate = localStorage.getItem('lastCoinUpdate');

    // যদি coin আজ ইতিমধ্যে আপডেট হয়ে থাকে, তবে শুধু দেখান
    if (lastCoinUpdate === today) {
        const { data, error } = await supabaseClient
            .from('atto')
            .select('coin')
            .eq('acc', userAcc)
            .single();

        if (data && data.coin !== undefined) {
            document.getElementById('coin-count').innerText = "🪙" + data.coin.toFixed(2) + " pori";
        }
        return;
    }

    const { data, error } = await supabaseClient
        .from('atto')
        .select('day, coin')
        .eq('acc', userAcc)
        .single();

    if (error || !data) {
        console.error('Error fetching data: ' + (error ? error.message : 'No data found'));
        return;
    }

    let day = data.day || 0;
    let cc = data.coin || 0;
    let newCoinGain = day / 4;

    document.getElementById('coin-count').innerText = "🪙" + (cc + newCoinGain).toFixed(2) + " pori";

    const { error: coinUpdateError } = await supabaseClient
        .from('atto')
        .update({ coin: cc + newCoinGain })
        .eq('acc', userAcc);

    if (coinUpdateError) {
        console.error('Update failed:', coinUpdateError.message);
    } else {
        // আজ coin আপডেট হয়েছে তা রেকর্ড করুন
        localStorage.setItem('lastCoinUpdate', today);
    }
}

setInterval(coin, 1000);


async function ml200f() {
    const { data, error } = await supabaseClient
        .from('atto')
        .select('drink')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();
    if (error || !data) {
        console.error('Error fetching drink data: ' + (error ? error.message : 'No data found'));
        return;
    }
    let currentDrink = data.drink || 0;
    const { error: drinkUpdateError } = await supabaseClient
        .from('atto')
        .update({ drink: parseInt(currentDrink) + 200 })
        .eq('acc', localStorage.getItem('userAcc'));
    if (drinkUpdateError) {
        console.error('Error updating drink data: ' + drinkUpdateError.message);
    }
    let today = new Date().toISOString().split('T')[0];
    let lastDrinkUpdate = localStorage.getItem('lastDrinkUpdate');

}

async function ml500f() {
    const { data, error } = await supabaseClient
        .from('atto')
        .select('drink')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();
    if (error || !data) {
        console.error('Error fetching drink data: ' + (error ? error.message : 'No data found'));
        return;
    }
    let currentDrink = data.drink || 0;
    const { error: drinkUpdateError } = await supabaseClient
        .from('atto')
        .update({ drink: parseInt(currentDrink) + 500 })
        .eq('acc', localStorage.getItem('userAcc'));
    if (drinkUpdateError) {
        console.error('Error updating drink data: ' + drinkUpdateError.message);
    }
    let today = new Date().toISOString().split('T')[0];
    let lastDrinkUpdate = localStorage.getItem('lastDrinkUpdate');
}

async function ml1000f() {
    const { data, error } = await supabaseClient
        .from('atto')
        .select('drink')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();
    if (error || !data) {
        console.error('Error fetching drink data: ' + (error ? error.message : 'No data found'));
        return;
    }
    let currentDrink = data.drink || 0;
    const { error: drinkUpdateError } = await supabaseClient
        .from('atto')
        .update({ drink: parseInt(currentDrink) + 1000 })
        .eq('acc', localStorage.getItem('userAcc'));
    if (drinkUpdateError) {
        console.error('Error updating drink data: ' + drinkUpdateError.message);
    }
    let today = new Date().toISOString().split('T')[0];
    let lastDrinkUpdate = localStorage.getItem('lastDrinkUpdate');
}

async function dshow() {
    const { data, error } = await supabaseClient
        .from('atto')
        .select('drink')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();
    if (error || !data) {
        console.error('Error fetching drink data: ' + (error ? error.message : 'No data found'));
        return;
    }
    let currentDrink = data.drink || 0;
    document.getElementById('liter-count').innerText = "💧" + currentDrink + " ml";
}
setInterval(dshow, 1000);

// drink logic
async function drink() {
    const { data, error } = await supabaseClient
        .from('atto')
        .select('drink')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();
    if (error || !data) {
        console.error('Error fetching drink data: ' + (error ? error.message : 'No data found'));
        return;
    }
    let currentDrink = data.drink || 0;
    let time = data.time;
    let day = data.day || 0;
    let coin = data.coin || 0;
    let today = new Date().toISOString().split('T')[0];
    let lastDrinkUpdate = localStorage.getItem('lastDrinkUpdate');
    let lastHistorySave = localStorage.getItem('lastHistorySave');
    
    if (lastDrinkUpdate !== today) {
        const { error: drinkResetError } = await supabaseClient
            .from('atto')
            .update({ drink: 0 })
            .eq('acc', localStorage.getItem('userAcc'));
        if (drinkResetError) {
            console.error('Error resetting drink data: ' + drinkResetError.message);
        }
        // আজ রিসেট হয়েছে তা রেকর্ড করুন
        localStorage.setItem('lastDrinkUpdate', today);
    }
    
    // History শুধুমাত্র একবার সংরক্ষণ করুন
    if (lastHistorySave !== today) {
        // drink history save
        const { error: historyInsertError } = await supabaseClient
            .from('history')
            .insert({ email: localStorage.getItem('userAcc'), date: new Date().toISOString(), ml: currentDrink });
        if (historyInsertError) {
            console.error('Error inserting drink history: ' + historyInsertError.message);
        } else {
            localStorage.setItem('lastHistorySave', today);
        }
    }
}
setInterval(drink, 1000);

async function buyItem() {
    let caditToBuy = parseInt(document.getElementById('buy-input').value); // ইনটেজার হিসেবে নেওয়া হলো
    let idOrEmail = document.getElementById('sell-input').value;

    if (isNaN(caditToBuy) || caditToBuy <= 0) {
        alert('Please enter a valid number of cadit to buy.');
        return;
    }

    const poriCost = 0.75; 
    let poriToPay = caditToBuy * poriCost;

    // ১. নিজের একাউন্ট থেকে pori আছে কিনা চেক করা
    const { data: userData, error: userError } = await supabaseClient
        .from('atto')
        .select('coin')
        .eq('acc', localStorage.getItem('userAcc'))
        .single();

    if (userError || !userData) {
        alert('Error fetching your coin data.');
        return;
    }

    if (userData.coin < poriToPay) {
        alert('You do not have enough pori!');
        return;
    }

    // ২. নিজের একাউন্ট থেকে pori বিয়োগ করা
    await supabaseClient
        .from('atto')
        .update({ coin: userData.coin - poriToPay })
        .eq('acc', localStorage.getItem('userAcc'));

    // ৩. 'asd' টেবিলের 'dd' কলামে ক্রেডিট যোগ করা (ছবির টেবিল অনুযায়ী)
    // প্রথমে চেক করা হচ্ছে ওই ইমেইল দিয়ে ডাটা আছে কিনা
    const { data: asdData, error: asdError } = await supabaseClient
        .from('asd')
        .select('dd')
        .eq('email and pass', idOrEmail)
        .single();

    if (asdData) {
        // যদি থাকে, আগের মানের সাথে নতুন ক্রেডিট যোগ করা
        let currentDD = parseInt(asdData.dd) || 0;
        const { error: updateError } = await supabaseClient
            .from('asd')
            .update({ dd: currentDD + caditToBuy })
            .eq('email and pass', idOrEmail);
            
        if(updateError) console.error(updateError);
    } else {
        // যদি না থাকে, নতুন করে ইনসার্ট করা
        const { error: insertError } = await supabaseClient
            .from('asd')
            .insert([{ "email and pass": idOrEmail, dd: caditToBuy }]);
            
        if(insertError) console.error(insertError);
    }

    alert(`Successfully bought ${caditToBuy} cadit!`);
}