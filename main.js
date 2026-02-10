// Supabase সেটআপ
const supabaseUrl = 'https://dnelzlyuhhxloysstnlg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZWx6bHl1aGh4bG95c3N0bmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM4MjAsImV4cCI6MjA4MTQyOTgyMH0.jYdJM1FTJja_A5CdTN3C3FWlKd_0E1JgHyaM4767SLc'

// ভেরিয়েবলের নাম 'supabaseClient' রাখা হয়েছে যাতে CDN এর সাথে কনফ্লিক্ট না হয়
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

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
    let timeString = date.toLocaleString(); // আরও সহজ ফরম্যাট
    let userAcc = localStorage.getItem('userAcc');

    if (!userAcc) {
        alert('User not logged in!');
        return;
    }

    // এখানে .insert() এর বদলে .update() ব্যবহার করা হয়েছে
    const { data, error } = await supabaseClient
        .from('atto')
        .update({ time: timeString }) // 'time' কলাম আপডেট হবে
        .eq('acc', userAcc);          // যেখানে 'acc' মিলে যাবে

    if (error) {
        alert('Error: ' + error.message);
        console.error(error); 
    } else {
        alert('Time recorded successfully!');
    }
}

async function show() {
    let userAcc = localStorage.getItem('userAcc');

    if (!userAcc) {
        console.warn('User not logged in!'); // Using warn instead of alert to avoid spamming every second
        return;
    }

    const { data, error } = await supabaseClient
        .from('atto')
        .select('time')
        .eq('acc', userAcc)
        .single(); // Use .single() if you only expect one row back

    if (error) {
        console.error('Error:', error.message);
    } else if (data) {
        let pastDate = new Date(data.time); 
        let now = new Date();

        // Calculate difference in milliseconds
        let diffInMs = now - pastDate;

        // Convert to seconds (or whatever unit you need)
        let diffInSeconds = Math.floor(diffInMs / 1000);
        let diffInMinutes = Math.floor(diffInSeconds / 60);
        let diffInHours = Math.floor(diffInMinutes / 60);
        let diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) {
            document.getElementById('time').innerText = diffInDays + " day";
        } else if (diffInHours > 0) {
            document.getElementById('time').innerText = diffInHours + " hour";
        } else if (diffInMinutes > 0) {
            document.getElementById('time').innerText = diffInMinutes + " minute";
        } else {
            document.getElementById('time').innerText = diffInSeconds + " second";
        }
    }
}

setInterval(show, 1000);