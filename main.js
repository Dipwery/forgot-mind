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

    if (!userAcc) {
        alert('User not logged in!');
        return;
    }

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
    } else if (diffInHours > 0) {
        displayElement.innerText = diffInHours + " hour " + (diffInMinutes % 60) + " minute";
    } else if (diffInMinutes > 0) {
        displayElement.innerText = diffInMinutes + " minute " + (diffInSeconds % 60) + " second";
    } else {
        displayElement.innerText = diffInSeconds + " second";
    }
}
setInterval(show, 1000);