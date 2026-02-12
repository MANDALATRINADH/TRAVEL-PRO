// ============================
// MAIN APPLICATION
// ============================

// Application State
let currentUser = null;
let currentRoute = null;
let selectedTransport = null;
let citiesDisplayed = 12;
let bookingDetails = null;
let isGuest = true;
let chatHistory = [];
let currentStep = 1;
let userAge = null;
let activeCarouselInterval = null;

// ============================
// NAVIGATION FUNCTIONS
// ============================

function handleNavClick(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleBookingClick() {
    if (!currentRoute) {
        Swal.fire({
            title: 'Plan Route First',
            text: 'Please calculate a route before proceeding to booking',
            icon: 'info',
            confirmButtonText: 'Go to Planner'
        }).then(() => {
            handleNavClick('planner');
        });
    } else {
        handleNavClick('booking-section');
    }
}

function handleDashboardClick() {
    if (isGuest) {
        showLoginModal();
    } else {
        showUserDashboard();
    }
}

function scrollToPlanner() {
    handleNavClick('planner');
}

function showCitiesGallery() {
    handleNavClick('cities');
}

// ============================
// MODAL FUNCTIONS
// ============================

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    switchLoginTab('login');
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showSignupModal() {
    document.getElementById('loginModal').style.display = 'flex';
    switchLoginTab('signup');
}

function switchLoginTab(tab) {
    // Update tabs
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('signupTab').classList.remove('active');
    document.getElementById('guestTab').classList.remove('active');
    
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    // Show selected form
    document.getElementById('loginFormContainer').classList.add('hidden');
    document.getElementById('signupFormContainer').classList.add('hidden');
    document.getElementById('guestModeContainer').classList.add('hidden');
    
    document.getElementById(`${tab}FormContainer`).classList.remove('hidden');
}

function continueAsGuest() {
    currentUser = {
        id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@travelflux.com',
        isGuest: true
    };
    isGuest = true;
    updateUserUI();
    closeLoginModal();
    
    Swal.fire({
        title: 'Welcome Guest!',
        text: 'You can explore routes and cities. Login to save routes and book tickets.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
    });
}

function socialLogin(provider) {
    Swal.fire({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`,
        text: `This would redirect to ${provider} authentication in a real application`,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

function showForgotPassword() {
    Swal.fire({
        title: 'Reset Password',
        html: `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-key text-violet-400 text-2xl"></i>
                </div>
                <p class="text-gray-300 mb-4">Enter your email to reset password</p>
                <input type="email" id="resetEmail" class="input-field w-full mb-4" placeholder="you@example.com">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send Reset Link',
        preConfirm: () => {
            const email = document.getElementById('resetEmail').value;
            if (!email) {
                Swal.showValidationMessage('Please enter your email');
                return false;
            }
            return email;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Email Sent!',
                text: 'Check your email for password reset instructions',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }
    });
}

// ============================
// LOGIN/SIGNUP FUNCTIONS
// ============================

function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Get stored users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('travelflux_users') || '[]');
    
    // Find user with matching email and password
    const user = storedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            dob: user.dob,
            age: user.age,
            isGuest: false
        };
        
        localStorage.setItem('travelflux_user', JSON.stringify(currentUser));
        
        Swal.fire({
            title: 'Welcome Back!',
            text: 'Successfully logged in',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        
        closeLoginModal();
        updateUserUI();
        updateAgeVerificationUI();
        isGuest = false;
    } else {
        Swal.fire({
            title: 'Login Failed',
            text: 'Invalid email or password',
            icon: 'error',
            confirmButtonText: 'Try Again'
        });
    }
}

function handleEmailSignup(event) {
    event.preventDefault();
    
    // Validate age first
    if (!validateAge()) {
        Swal.fire('Error', 'You must be 18 years or older to register', 'error');
        return;
    }
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const mobile = document.getElementById('mobileNumber').value;
    const password = document.getElementById('signupPassword').value;
    const dob = document.getElementById('dob').value;
    const terms = document.getElementById('terms').checked;
    
    if (!terms) {
        Swal.fire('Error', 'Please agree to Terms & Conditions', 'error');
        return;
    }
    
    // Calculate age
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
    }
    
    // Check if user already exists
    const storedUsers = JSON.parse(localStorage.getItem('travelflux_users') || '[]');
    const existingUser = storedUsers.find(u => u.email === email);
    
    if (existingUser) {
        Swal.fire('Error', 'Email already registered. Please login instead.', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: `${firstName} ${lastName}`,
        email: email,
        mobile: mobile,
        password: password,
        dob: dob,
        age: age,
        createdAt: new Date().toISOString()
    };
    
    // Save to users list
    storedUsers.push(newUser);
    localStorage.setItem('travelflux_users', JSON.stringify(storedUsers));
    
    // Set as current user
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        dob: newUser.dob,
        age: newUser.age,
        isGuest: false
    };
    
    localStorage.setItem('travelflux_user', JSON.stringify(currentUser));
    
    Swal.fire({
        title: 'Account Created!',
        html: `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-violet-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Welcome to TravelFlux Pro!</h3>
                <p class="text-gray-300">Your account has been created successfully.</p>
                <div class="mt-4 p-3 bg-violet-500/10 rounded-lg">
                    <p class="text-sm text-violet-300">Age Verified: ${age} years</p>
                </div>
            </div>
        `,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
    
    closeLoginModal();
    updateUserUI();
    updateAgeVerificationUI();
    isGuest = false;
}

function validateAge() {
    const dobInput = document.getElementById('dob');
    const ageError = document.getElementById('ageError');
    if (!dobInput || !dobInput.value) return false;
    
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        ageError.classList.remove('hidden');
        dobInput.style.borderColor = '#ef4444';
        return false;
    } else {
        ageError.classList.add('hidden');
        dobInput.style.borderColor = '#8b5cf6';
        return true;
    }
}

function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let text = '';
    let color = '';
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch(strength) {
        case 0:
        case 1:
            text = 'Weak';
            color = '#ef4444';
            break;
        case 2:
            text = 'Fair';
            color = '#f59e0b';
            break;
        case 3:
            text = 'Good';
            color = '#10b981';
            break;
        case 4:
            text = 'Strong';
            color = '#8b5cf6';
            break;
    }
    
    strengthBar.style.width = `${strength * 25}%`;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = `Password Strength: ${text}`;
    strengthText.style.color = color;
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.type = field.type === 'password' ? 'text' : 'password';
    }
}

// ============================
// USER MENU FUNCTIONS
// ============================

function logout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('travelflux_user');
            currentUser = {
                id: 'guest_' + Date.now(),
                name: 'Guest User',
                email: 'guest@travelflux.com',
                isGuest: true
            };
            isGuest = true;
            updateUserUI();
            
            Swal.fire({
                title: 'Logged Out',
                text: 'You have been successfully logged out',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

function updateUserUI() {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const loginButtonText = document.getElementById('loginButtonText');
    
    if (currentUser && !currentUser.isGuest) {
        usernameDisplay.textContent = currentUser.name.split(' ')[0];
        dropdownName.textContent = currentUser.name;
        dropdownEmail.textContent = currentUser.email;
        loginButtonText.textContent = 'Profile';
    } else {
        usernameDisplay.textContent = 'Guest';
        dropdownName.textContent = 'Guest User';
        dropdownEmail.textContent = 'guest@travelflux.com';
        loginButtonText.textContent = 'Login';
    }
}

function updateAgeVerificationUI() {
    const ageBadge = document.getElementById('ageVerificationBadge');
    if (!ageBadge) return;
    
    if (currentUser && currentUser.age >= 18) {
        ageBadge.className = 'age-verification age-verified';
        ageBadge.innerHTML = `
            <i class="fas fa-id-card"></i>
            <span>Age: ${currentUser.age} years (Verified)</span>
        `;
    } else {
        ageBadge.className = 'age-verification age-not-verified';
        ageBadge.innerHTML = `
            <i class="fas fa-id-card"></i>
            <span>Age: Not Verified</span>
        `;
    }
}

function showAgeVerification() {
    if (isGuest) {
        Swal.fire({
            title: 'Login Required',
            text: 'Please login to verify your age',
            icon: 'warning',
            confirmButtonText: 'Login'
        }).then(() => {
            showLoginModal();
        });
        return;
    }
    
    Swal.fire({
        title: 'Verify Your Age',
        html: `
            <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-id-card text-violet-400 text-3xl"></i>
                </div>
                <p class="text-gray-300 mb-4">Age verification is required for booking certain transport options</p>
                
                <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">Current Status:</span>
                        <span class="${currentUser.age >= 18 ? 'text-violet-400' : 'text-red-400'} font-bold">
                            ${currentUser.age >= 18 ? 'Verified' : 'Not Verified'}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Age:</span>
                        <span class="text-white">${currentUser.age || 'Not provided'} years</span>
                    </div>
                </div>
                
                ${currentUser.age < 18 ? `
                    <p class="text-red-400 text-sm mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        You must be 18 or older to book certain transport options
                    </p>
                ` : ''}
            </div>
        `,
        showCancelButton: currentUser.age < 18,
        confirmButtonText: currentUser.age >= 18 ? 'OK' : 'Update Age',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed && currentUser.age < 18) {
            Swal.fire({
                title: 'Update Date of Birth',
                html: `
                    <input type="date" 
                           id="updateDob" 
                           class="input-field w-full mt-2"
                           onchange="checkUpdateAge()">
                    <p id="updateAgeError" class="text-xs text-red-400 mt-1 hidden"></p>
                `,
                showCancelButton: true,
                confirmButtonText: 'Update',
                preConfirm: () => {
                    const dobInput = document.getElementById('updateDob');
                    if (!dobInput || !dobInput.value) {
                        Swal.showValidationMessage('Please select a date');
                        return false;
                    }
                    
                    const dob = new Date(dobInput.value);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const monthDiff = today.getMonth() - dob.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    
                    if (age < 18) {
                        Swal.showValidationMessage('Must be 18 years or older');
                        return false;
                    }
                    
                    return { dob: dobInput.value, age: age };
                }
            }).then((updateResult) => {
                if (updateResult.isConfirmed) {
                    // Update user age
                    currentUser.dob = updateResult.value.dob;
                    currentUser.age = updateResult.value.age;
                    
                    // Update in localStorage
                    const storedUser = JSON.parse(localStorage.getItem('travelflux_user'));
                    if (storedUser) {
                        storedUser.dob = currentUser.dob;
                        storedUser.age = currentUser.age;
                        localStorage.setItem('travelflux_user', JSON.stringify(storedUser));
                    }
                    
                    // Update in users list
                    const storedUsers = JSON.parse(localStorage.getItem('travelflux_users') || '[]');
                    const userIndex = storedUsers.findIndex(u => u.id === currentUser.id);
                    if (userIndex !== -1) {
                        storedUsers[userIndex].dob = currentUser.dob;
                        storedUsers[userIndex].age = currentUser.age;
                        localStorage.setItem('travelflux_users', JSON.stringify(storedUsers));
                    }
                    
                    updateAgeVerificationUI();
                    
                    Swal.fire({
                        title: 'Age Updated!',
                        text: 'Your age has been verified successfully',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        }
    });
}

function checkUpdateAge() {
    const dobInput = document.getElementById('updateDob');
    const ageError = document.getElementById('updateAgeError');
    if (!dobInput || !dobInput.value) return;
    
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    if (age < 18) {
        ageError.textContent = 'Must be 18 years or older';
        ageError.classList.remove('hidden');
        dobInput.style.borderColor = '#ef4444';
    } else {
        ageError.classList.add('hidden');
        dobInput.style.borderColor = '#10b981';
    }
}

// ============================
// ROUTE PLANNING FUNCTIONS
// ============================

function calculateRoute() {
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    
    if (!fromInput.value || !toInput.value) {
        Swal.fire('Error', 'Please enter both starting and destination cities', 'error');
        return;
    }
    
    const fromCity = andhraPradeshCities.find(city => 
        city.name.toLowerCase() === fromInput.value.toLowerCase()
    );
    const toCity = andhraPradeshCities.find(city => 
        city.name.toLowerCase() === toInput.value.toLowerCase()
    );
    
    if (!fromCity || !toCity) {
        Swal.fire('Error', 'One or both cities not found in our database', 'error');
        return;
    }
    
    if (fromCity.name === toCity.name) {
        Swal.fire('Error', 'Starting and destination cities cannot be the same', 'error');
        return;
    }
    
    // Calculate distance using Haversine formula
    const distance = calculateDistance(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon);
    
    // Get other inputs
    const travelDate = document.getElementById('travelDate').value || new Date().toISOString().split('T')[0];
    const passengers = parseInt(document.getElementById('passengerCount').value) || 1;
    const priority = document.getElementById('priority').value;
    
    // Store current route
    currentRoute = {
        from: fromCity.name,
        to: toCity.name,
        distance: distance,
        date: travelDate,
        passengers: passengers,
        priority: priority,
        fromLat: fromCity.lat,
        fromLon: fromCity.lon,
        toLat: toCity.lat,
        toLon: toCity.lon
    };
    
    // Calculate time based on priority
    let time;
    switch(priority) {
        case 'fastest':
            time = distance / 80; // Average speed 80 km/h
            break;
        case 'cheapest':
            time = distance / 60; // Average speed 60 km/h
            break;
        case 'comfort':
            time = distance / 70; // Average speed 70 km/h
            break;
        default:
            time = distance / 70;
    }
    
    // Update UI
    document.getElementById('routeSummary').textContent = `${fromCity.name} to ${toCity.name}`;
    document.getElementById('routeDistance').textContent = `${distance.toFixed(2)} km`;
    document.getElementById('routeTime').textContent = `${time.toFixed(1)} hrs`;
    
    // Calculate estimated cost
    const baseCost = distance * 5; // Base cost per km
    document.getElementById('routeCost').textContent = `₹ ${(baseCost * passengers).toFixed(2)}`;
    
    // Show transport options
    showTransportOptions(distance, time);
    
    // Show results
    document.getElementById('routeResults').classList.remove('hidden');
    
    // Update preview
    updatePreview(fromCity.name, toCity.name, distance, time, baseCost * passengers);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function showTransportOptions(distance, time) {
    const transportOptions = document.getElementById('transportOptions');
    if (!transportOptions) return;
    
    const transports = [
        { type: 'bus', icon: 'fa-bus', color: 'violet', pricePerKm: 1.5, speed: 60 },
        { type: 'train', icon: 'fa-train', color: 'violet', pricePerKm: 2, speed: 80 },
        { type: 'car', icon: 'fa-car', color: 'violet', pricePerKm: 8, speed: 70 },
        { type: 'auto', icon: 'fa-rickshaw', color: 'violet', pricePerKm: 10, speed: 40 },
        { type: 'flight', icon: 'fa-plane', color: 'purple', pricePerKm: 5, speed: 500 }
    ];
    
    transportOptions.innerHTML = transports.map(transport => {
        const price = distance * transport.pricePerKm;
        const travelTime = distance / transport.speed;
        
        return `
            <div class="transport-option ${selectedTransport === transport.type ? 'selected' : ''}" 
                 onclick="selectTransport('${transport.type}', ${price}, ${travelTime})">
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 rounded-lg bg-${transport.color}-500/20 flex items-center justify-center mb-3">
                        <i class="fas ${transport.icon} text-${transport.color}-400 text-xl"></i>
                    </div>
                    <h4 class="font-bold text-white mb-1">${transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}</h4>
                    <p class="text-sm text-gray-400 mb-2">${travelTime.toFixed(1)} hrs</p>
                    <p class="text-lg font-bold text-violet-400">₹ ${price.toFixed(2)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function selectTransport(type, price, time) {
    selectedTransport = type;
    
    // Update selected state in UI
    document.querySelectorAll('.transport-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Update route cost with selected transport
    const passengers = parseInt(document.getElementById('passengerCount').value) || 1;
    document.getElementById('routeCost').textContent = `₹ ${(price * passengers).toFixed(2)}`;
    document.getElementById('routeTime').textContent = `${time.toFixed(1)} hrs`;
}

function selectTransportPreview(type) {
    if (!currentRoute) {
        Swal.fire('Info', 'Please calculate a route first', 'info');
        return;
    }
    
    const transportPrices = {
        bus: 1.5,
        train: 2,
        car: 8,
        auto: 10,
        flight: 5
    };
    
    const transportSpeeds = {
        bus: 60,
        train: 80,
        car: 70,
        auto: 40,
        flight: 500
    };
    
    const price = currentRoute.distance * transportPrices[type] * currentRoute.passengers;
    const time = currentRoute.distance / transportSpeeds[type];
    
    updatePreview(
        currentRoute.from,
        currentRoute.to,
        currentRoute.distance,
        time,
        price
    );
    
    // Highlight selected transport
    document.querySelectorAll('.transport-icon').forEach(icon => {
        if (icon.querySelector('div')) {
            icon.querySelector('div').classList.remove('bg-violet-500');
            icon.querySelector('div').classList.add('bg-gray-900');
        }
    });
    if (event.currentTarget.querySelector('div')) {
        event.currentTarget.querySelector('div').classList.remove('bg-gray-900');
        event.currentTarget.querySelector('div').classList.add('bg-violet-500');
    }
}

function updatePreview(from, to, distance, time, price) {
    const previewFrom = document.getElementById('previewFrom');
    const previewTo = document.getElementById('previewTo');
    const previewDistance = document.getElementById('previewDistance');
    const previewTime = document.getElementById('previewTime');
    const previewPrice = document.getElementById('previewPrice');
    const previewDetails = document.getElementById('previewDetails');
    
    if (previewFrom) previewFrom.textContent = from;
    if (previewTo) previewTo.textContent = to;
    if (previewDistance) previewDistance.textContent = `${distance.toFixed(2)} km`;
    if (previewTime) previewTime.textContent = `${time.toFixed(1)} hrs`;
    if (previewPrice) previewPrice.textContent = `₹ ${price.toFixed(2)}`;
    if (previewDetails) previewDetails.classList.remove('hidden');
}

function handleCitySearch(type) {
    const input = document.getElementById(`${type}Input`);
    const suggestionsDiv = document.getElementById(`${type}Suggestions`);
    if (!input || !suggestionsDiv) return;
    
    const query = input.value.toLowerCase();
    
    if (query.length < 2) {
        suggestionsDiv.classList.add('hidden');
        return;
    }
    
    const filteredCities = andhraPradeshCities.filter(city =>
        city.name.toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (filteredCities.length > 0) {
        suggestionsDiv.innerHTML = filteredCities.map(city => `
            <div class="p-3 hover:bg-gray-900 cursor-pointer border-b border-gray-800 last:border-b-0"
                 onclick="selectCity('${type}', '${city.name}')">
                <div class="font-medium text-white">${city.name}</div>
                <div class="text-sm text-gray-400">${city.state || 'Andhra Pradesh'}</div>
            </div>
        `).join('');
        suggestionsDiv.classList.remove('hidden');
    } else {
        suggestionsDiv.classList.add('hidden');
    }
}

function showCitySuggestions(type) {
    handleCitySearch(type);
}

function selectCity(type, cityName) {
    const input = document.getElementById(`${type}Input`);
    const suggestionsDiv = document.getElementById(`${type}Suggestions`);
    
    if (input) input.value = cityName;
    if (suggestionsDiv) suggestionsDiv.classList.add('hidden');
    
    // Update preview if both cities are selected
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');
    
    if (fromInput && fromInput.value && toInput && toInput.value) {
        const fromCity = andhraPradeshCities.find(c => c.name === fromInput.value);
        const toCity = andhraPradeshCities.find(c => c.name === toInput.value);
        
        if (fromCity && toCity) {
            const distance = calculateDistance(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon);
            updatePreview(fromCity.name, toCity.name, distance, distance/70, distance * 5);
        }
    }
}

function toggleAdvancedOptions() {
    const options = document.getElementById('advancedOptions');
    const arrow = document.getElementById('advancedArrow');
    if (!options || !arrow) return;
    
    if (options.classList.contains('hidden')) {
        options.classList.remove('hidden');
        arrow.classList.remove('fa-chevron-down');
        arrow.classList.add('fa-chevron-up');
    } else {
        options.classList.add('hidden');
        arrow.classList.remove('fa-chevron-up');
        arrow.classList.add('fa-chevron-down');
    }
}

function adjustPassengers(change) {
    const passengerCount = document.getElementById('passengerCount');
    if (!passengerCount) return;
    
    let count = parseInt(passengerCount.value) || 1;
    count += change;
    
    if (count < 1) count = 1;
    if (count > 10) count = 10;
    
    passengerCount.value = count;
    
    // Update route cost if a route is calculated
    if (currentRoute && selectedTransport) {
        const transportPrices = {
            bus: 1.5,
            train: 2,
            car: 8,
            auto: 10,
            flight: 5
        };
        
        const price = currentRoute.distance * transportPrices[selectedTransport] * count;
        const routeCost = document.getElementById('routeCost');
        if (routeCost) routeCost.textContent = `₹ ${price.toFixed(2)}`;
    }
}

// ============================
// FIXED CITIES FUNCTIONS (NO DUPLICATES)
// ============================

function loadPopularCities() {
    const popularCitiesDiv = document.getElementById('popularCities');
    if (!popularCitiesDiv) return;
    
    const popularCities = andhraPradeshCities
        .filter(city => city.popular)
        .slice(0, 12);
    
    popularCitiesDiv.innerHTML = popularCities.map(city => {
        // Use default image if no city image
        const defaultImage = "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format";
        const imageUrl = city.image || city.images?.[0] || defaultImage;
        
        return `
            <div class="text-center cursor-pointer group" onclick="selectCity('from', '${city.name}')">
                <div class="aspect-ratio-box rounded-xl overflow-hidden mb-2 group-hover:scale-105 transition-transform duration-300 bg-gray-800">
                    <img src="${imageUrl}" 
                         alt="${city.name}"
                         class="w-full h-full object-cover"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${defaultImage}'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div class="absolute bottom-3 left-0 right-0 px-3">
                        <p class="text-sm font-semibold text-white truncate">${city.name}</p>
                        <p class="text-xs text-gray-300 mt-1">${city.district || city.type || 'Andhra Pradesh'}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadCitiesGrid() {
    const citiesGrid = document.getElementById('citiesGrid');
    if (!citiesGrid) return;
    
    const citiesToShow = andhraPradeshCities.slice(0, citiesDisplayed);
    
    citiesGrid.innerHTML = citiesToShow.map(city => {
        // Get images with fallbacks
        const defaultImages = [
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop&auto=format',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format'
        ];
        
        const images = city.images && city.images.length > 0 
            ? [...city.images] 
            : [city.image || defaultImages[0]];
        
        // Ensure we have at least 3 images for the grid
        while (images.length < 3) {
            images.push(defaultImages[images.length % defaultImages.length]);
        }
        
        return `
        <div class="glass p-6 rounded-xl card-hover">
            <div class="relative h-48 rounded-lg overflow-hidden mb-4">
                <img src="${images[0]}" 
                     alt="${city.name}"
                     class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${defaultImages[0]}'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div class="absolute top-3 right-3">
                    <span class="px-2 py-1 rounded text-xs ${city.category === 'major' ? 'bg-violet-600 text-white' : city.category === 'tourist' ? 'bg-purple-600 text-white' : city.category === 'district' ? 'bg-violet-500 text-white' : 'bg-gray-700 text-gray-300'}">
                        ${city.category || 'City'}
                    </span>
                </div>
                <div class="absolute bottom-3 left-3 right-3">
                    <h3 class="text-xl font-bold text-white mb-1">${city.name}</h3>
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-map-marker-alt text-violet-300 text-xs"></i>
                        <span class="text-sm text-gray-300">${city.district || city.state || 'Andhra Pradesh'}</span>
                    </div>
                </div>
            </div>
            
            <p class="text-gray-300 text-sm mb-4 line-clamp-2">${city.description || `Explore ${city.name} in ${city.state || 'Andhra Pradesh'}`}</p>
            
            <div class="fixed-image-grid mb-4">
                ${images.slice(0, 3).map((img, index) => `
                    <img src="${img}" 
                         alt="${city.name} view ${index + 1}"
                         class="fixed-grid-image"
                         loading="lazy"
                         onclick="showCityImage('${city.name}', '${img}')"
                         onerror="this.onerror=null; this.src='${defaultImages[index % defaultImages.length]}'">
                `).join('')}
            </div>
            
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span class="text-xs text-gray-400 flex items-center">
                        <i class="fas fa-clock mr-1"></i>
                        ${city.bestTime || 'All Year'}
                    </span>
                </div>
                <button onclick="selectCity('from', '${city.name}')" 
                        class="text-violet-400 hover:text-violet-300 text-sm flex items-center space-x-1">
                    <span>Route</span>
                    <i class="fas fa-arrow-right text-xs"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    // Update load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (citiesDisplayed >= andhraPradeshCities.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-flex';
        }
    }
}

function filterCities() {
    const filter = document.getElementById('cityTypeFilter');
    if (!filter) return;
    
    const filterValue = filter.value;
    let filteredCities = andhraPradeshCities;
    
    if (filterValue) {
        filteredCities = andhraPradeshCities.filter(city => 
            city.category === filterValue || city.type === filterValue
        );
    }
    
    citiesDisplayed = 12;
    loadCitiesGrid();
    handleNavClick('cities');
}

function searchCities() {
    const searchInput = document.getElementById('citySearch');
    const resultsDiv = document.getElementById('citySearchResults');
    if (!searchInput || !resultsDiv) return;
    
    const query = searchInput.value.toLowerCase();
    
    if (query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    const filteredCities = andhraPradeshCities.filter(city =>
        city.name.toLowerCase().includes(query) ||
        (city.description && city.description.toLowerCase().includes(query)) ||
        city.district?.toLowerCase().includes(query)
    ).slice(0, 8);
    
    if (filteredCities.length > 0) {
        resultsDiv.innerHTML = filteredCities.map(city => `
            <div class="p-3 hover:bg-gray-900 cursor-pointer border-b border-gray-800 last:border-b-0"
                 onclick="showCityDetails('${city.name}')">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-white">${city.name}</div>
                        <div class="text-sm text-gray-400">${city.district || city.state || 'Andhra Pradesh'}</div>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs ${city.category === 'major' ? 'bg-violet-500/20 text-violet-300' : city.category === 'tourist' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'}">
                        ${city.category || 'City'}
                    </span>
                </div>
                ${city.description ? `<div class="text-sm text-gray-300 mt-2 truncate">${city.description.substring(0, 80)}...</div>` : ''}
            </div>
        `).join('');
        resultsDiv.classList.remove('hidden');
    } else {
        resultsDiv.classList.add('hidden');
    }
}

function showCityDetails(cityName) {
    // Clear any existing carousel interval
    if (activeCarouselInterval) {
        clearInterval(activeCarouselInterval);
        activeCarouselInterval = null;
    }
    
    const city = andhraPradeshCities.find(c => c.name === cityName);
    if (!city) return;
    
    // Get images with fallbacks
    const defaultImages = [
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format'
    ];
    
    const images = city.images && city.images.length > 0 
        ? [...city.images] 
        : [city.image || defaultImages[0]];
    
    // Ensure we have at least 3 images
    while (images.length < 3) {
        images.push(defaultImages[images.length % defaultImages.length]);
    }
    
    Swal.fire({
        title: city.name,
        html: `
            <div class="text-left">
                <!-- Fixed Carousel -->
                <div class="fixed-carousel mb-6" id="cityCarousel">
                    ${images.map((img, index) => `
                        <div class="fixed-carousel-slide ${index === 0 ? 'active' : ''}" 
                             style="background-image: url('${img}')"
                             data-index="${index}">
                        </div>
                    `).join('')}
                    <div class="fixed-carousel-nav" id="carouselNav">
                        ${images.map((_, index) => `
                            <div class="fixed-carousel-dot ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}"
                                 onclick="changeCarouselSlide(${index})"></div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- City Info -->
                <div class="mb-6">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-2xl font-bold text-white mb-2">${city.name}</h3>
                            <div class="flex items-center space-x-2">
                                <span class="px-3 py-1 rounded-full text-sm ${city.category === 'major' ? 'bg-violet-500/20 text-violet-300' : city.category === 'tourist' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'}">
                                    ${city.category || 'City'}
                                </span>
                                <span class="text-gray-400">${city.district || city.state || 'Andhra Pradesh'}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-400">Coordinates</p>
                            <p class="text-sm text-gray-300">${city.lat?.toFixed(4) || 'N/A'}°, ${city.lon?.toFixed(4) || 'N/A'}°</p>
                        </div>
                    </div>
                    
                    <p class="text-gray-300 mb-4">${city.description || 'Discover this beautiful city in Andhra Pradesh.'}</p>
                    
                    ${city.attractions && city.attractions.length > 0 ? `
                        <div class="mb-4">
                            <h4 class="font-bold text-white mb-2">Attractions</h4>
                            <div class="flex flex-wrap gap-2">
                                ${city.attractions.slice(0, 5).map(attraction => `
                                    <span class="px-3 py-1 rounded-full text-sm bg-gray-800/50 text-gray-300">
                                        ${attraction}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="glass p-4 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <i class="fas fa-calendar-alt text-violet-400"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white mb-1">Best Time</h4>
                                <p class="text-gray-300">${city.bestTime || 'All Year'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass p-4 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <i class="fas fa-train text-violet-400"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white mb-1">Transport</h4>
                                <p class="text-gray-300">${city.transport || 'Bus, Train'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass p-4 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <i class="fas fa-road text-violet-400"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white mb-1">Plan Route</h4>
                                <p class="text-gray-300">Start planning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Plan Route From Here',
        cancelButtonText: 'Close',
        width: 700,
        didOpen: () => {
            // Initialize carousel after modal opens
            initializeCarousel();
        },
        willClose: () => {
            // Clean up interval when modal closes
            if (activeCarouselInterval) {
                clearInterval(activeCarouselInterval);
                activeCarouselInterval = null;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            selectCity('from', city.name);
            handleNavClick('planner');
        }
    });
}

function initializeCarousel() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.fixed-carousel-slide');
    const dots = document.querySelectorAll('.fixed-carousel-dot');
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show selected slide
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    // Function to change slide (exposed globally)
    window.changeCarouselSlide = function(index) {
        showSlide(index);
        // Reset interval
        if (activeCarouselInterval) {
            clearInterval(activeCarouselInterval);
        }
        startCarouselInterval();
    };
    
    function startCarouselInterval() {
        activeCarouselInterval = setInterval(() => {
            let nextSlide = currentSlide + 1;
            if (nextSlide >= slides.length) nextSlide = 0;
            showSlide(nextSlide);
        }, 4000);
    }
    
    // Start the carousel
    startCarouselInterval();
    
    // Pause on hover
    const carousel = document.getElementById('cityCarousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            if (activeCarouselInterval) {
                clearInterval(activeCarouselInterval);
            }
        });
        
        carousel.addEventListener('mouseleave', () => {
            startCarouselInterval();
        });
    }
}

function showCityImage(cityName, imageUrl) {
    Swal.fire({
        imageUrl: imageUrl,
        imageAlt: cityName,
        imageHeight: 500,
        imageWidth: 'auto',
        showConfirmButton: false,
        showCloseButton: true,
        width: '90%',
        background: 'rgba(15, 23, 42, 0.95)',
        customClass: {
            popup: 'rounded-2xl',
            image: 'rounded-lg',
            closeButton: 'text-white bg-black/50 hover:bg-black/70 rounded-full p-2'
        }
    });
}

function loadMoreCities() {
    citiesDisplayed += 12;
    if (citiesDisplayed > andhraPradeshCities.length) {
        citiesDisplayed = andhraPradeshCities.length;
    }
    loadCitiesGrid();
}

// ============================
// BOOKING FUNCTIONS
// ============================

function proceedToBooking() {
    if (!currentRoute) {
        Swal.fire('Error', 'Please calculate a route first', 'error');
        return;
    }
    
    if (!selectedTransport) {
        Swal.fire('Error', 'Please select a transport option', 'error');
        return;
    }
    
    if (isGuest) {
        Swal.fire({
            title: 'Login Required',
            text: 'Please login to proceed with booking',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Login',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoginModal();
            }
        });
        return;
    }
    
    // Check age for certain transport options
    const ageRestrictedTransports = ['car', 'flight'];
    if (ageRestrictedTransports.includes(selectedTransport) && (!currentUser.age || currentUser.age < 18)) {
        Swal.fire({
            title: 'Age Verification Required',
            html: `
                <div class="text-center">
                    <div class="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-violet-400 text-2xl"></i>
                    </div>
                    <p class="text-gray-300 mb-4">
                        ${selectedTransport.charAt(0).toUpperCase() + selectedTransport.slice(1)} booking requires age verification.
                    </p>
                    <div class="bg-gray-900/50 rounded-lg p-4 mb-4">
                        <p class="text-sm text-gray-400">You must be 18 years or older to book ${selectedTransport} tickets.</p>
                        <p class="text-sm text-gray-400 mt-2">Your current age: <span class="${currentUser.age >= 18 ? 'text-violet-400' : 'text-red-400'}">${currentUser.age || 'Not provided'}</span></p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Verify Age',
            cancelButtonText: 'Choose Different Transport'
        }).then((result) => {
            if (result.isConfirmed) {
                showAgeVerification();
            }
        });
        return;
    }
    
    // Continue with booking...
    const transportPrices = {
        bus: 1.5,
        train: 2,
        car: 8,
        auto: 10,
        flight: 5
    };
    
    const baseFare = currentRoute.distance * transportPrices[selectedTransport] * currentRoute.passengers;
    const taxes = baseFare * 0.18;
    const serviceFee = 50;
    const total = baseFare + taxes + serviceFee;
    
    bookingDetails = {
        ...currentRoute,
        transport: selectedTransport,
        baseFare: baseFare,
        taxes: taxes,
        serviceFee: serviceFee,
        total: total,
        bookingId: 'TFLX' + Date.now().toString().slice(-8),
        userAge: currentUser.age
    };
    
    const bookingSection = document.getElementById('booking-section');
    const bookingDetailsDiv = document.getElementById('bookingDetails');
    
    if (!bookingDetailsDiv) return;
    
    bookingDetailsDiv.innerHTML = `
        <div class="glass p-6 rounded-xl">
            <h3 class="text-xl font-bold text-white mb-4">Booking Summary</h3>
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <div class="mb-4">
                        <h4 class="text-sm text-gray-400 mb-1">Route</h4>
                        <p class="text-lg font-bold text-white">${currentRoute.from} → ${currentRoute.to}</p>
                    </div>
                    <div class="mb-4">
                        <h4 class="text-sm text-gray-400 mb-1">Transport</h4>
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-${selectedTransport === 'auto' ? 'rickshaw' : selectedTransport} text-${selectedTransport === 'flight' ? 'purple' : 'violet'}-400"></i>
                            <span class="text-white font-medium">${selectedTransport.charAt(0).toUpperCase() + selectedTransport.slice(1)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="mb-4">
                        <h4 class="text-sm text-gray-400 mb-1">Date & Passengers</h4>
                        <p class="text-white">
                            ${new Date(currentRoute.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} • 
                            ${currentRoute.passengers} Passenger${currentRoute.passengers > 1 ? 's' : ''}
                        </p>
                    </div>
                    <div class="mb-4">
                        <h4 class="text-sm text-gray-400 mb-1">Booking ID</h4>
                        <p class="text-white font-mono">${bookingDetails.bookingId}</p>
                    </div>
                </div>
            </div>
            
            ${currentUser.age < 18 ? `
                <div class="mt-4 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-exclamation-triangle text-violet-400"></i>
                        <p class="text-sm text-violet-300">Age restriction may apply for some transport options</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="mt-6 pt-6 border-t border-gray-800">
                <h4 class="text-lg font-semibold text-white mb-4">Passenger Details</h4>
                <div class="space-y-4">
                    ${Array.from({length: currentRoute.passengers}, (_, i) => `
                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">Passenger ${i+1} Name</label>
                                <input type="text" class="input-field w-full" placeholder="Full Name" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">Age</label>
                                <input type="number" class="input-field w-full" placeholder="Age" min="1" max="120" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-300 mb-2">Gender</label>
                                <select class="input-field w-full">
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-6">
                    <h4 class="text-lg font-semibold text-white mb-4">Contact Information</h4>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                            <input type="email" class="input-field w-full" value="${currentUser.email}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                            <input type="tel" class="input-field w-full" value="${currentUser.mobile || ''}" required>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-between">
                    <button onclick="goBackToRoute()" class="btn-secondary">
                        <i class="fas fa-arrow-left mr-2"></i>Back
                    </button>
                    <button onclick="proceedToPayment()" class="btn-primary">
                        Continue to Payment <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Update payment summary
    const baseFareEl = document.getElementById('baseFare');
    const taxesEl = document.getElementById('taxes');
    const serviceFeeEl = document.getElementById('serviceFee');
    const totalAmountEl = document.getElementById('totalAmount');
    
    if (baseFareEl) baseFareEl.textContent = `₹ ${baseFare.toFixed(2)}`;
    if (taxesEl) taxesEl.textContent = `₹ ${taxes.toFixed(2)}`;
    if (serviceFeeEl) serviceFeeEl.textContent = `₹ ${serviceFee.toFixed(2)}`;
    if (totalAmountEl) totalAmountEl.textContent = `₹ ${total.toFixed(2)}`;
    
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function goBackToRoute() {
    handleNavClick('planner');
}

function proceedToPayment() {
    // Validate passenger details
    const passengerInputs = document.querySelectorAll('#bookingDetails input[type="text"], #bookingDetails input[type="number"], #bookingDetails select');
    let isValid = true;
    
    passengerInputs.forEach(input => {
        if (!input.value) {
            input.style.borderColor = '#ef4444';
            isValid = false;
        } else {
            input.style.borderColor = '#374151';
        }
    });
    
    if (!isValid) {
        Swal.fire('Error', 'Please fill all passenger details', 'error');
        return;
    }
    
    const paymentSection = document.getElementById('paymentSection');
    if (paymentSection) {
        paymentSection.classList.remove('hidden');
        document.querySelector('#booking-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function formatCardNumber(input) {
    if (!input) return;
    
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formatted += ' ';
        }
        formatted += value[i];
    }
    
    input.value = formatted.substring(0, 19);
}

function formatExpiryDate(input) {
    if (!input) return;
    
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = value.substring(0, 5);
}

function processPayment() {
    const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate')?.value;
    const cvv = document.getElementById('cvv')?.value;
    const cardHolder = document.getElementById('cardHolder')?.value;
    
    if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
        Swal.fire('Error', 'Please fill all payment details', 'error');
        return;
    }
    
    if (cardNumber.length < 16) {
        Swal.fire('Error', 'Please enter a valid 16-digit card number', 'error');
        return;
    }
    
    if (cvv.length < 3) {
        Swal.fire('Error', 'Please enter a valid 3-digit CVV', 'error');
        return;
    }
    
    // Simulate payment processing
    Swal.fire({
        title: 'Processing Payment',
        html: `
            <div class="text-center">
                <div class="loader mx-auto mb-4"></div>
                <p class="text-gray-300">Please wait while we process your payment...</p>
            </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false
    });
    
    setTimeout(() => {
        completeBooking('card');
    }, 2000);
}

function completeBooking(paymentMethod) {
    if (!bookingDetails) return;
    
    Swal.fire({
        title: 'Booking Confirmed!',
        html: `
            <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-violet-400 text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Booking Successful!</h3>
                <p class="text-gray-300 mb-4">Your travel booking has been confirmed</p>
                
                <div class="glass p-4 rounded-lg mb-4">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">Booking ID:</span>
                        <span class="text-white font-mono">${bookingDetails.bookingId}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">Route:</span>
                        <span class="text-white">${bookingDetails.from} → ${bookingDetails.to}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-400">Amount:</span>
                        <span class="text-violet-400 font-bold">₹ ${bookingDetails.total.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Payment Method:</span>
                        <span class="text-violet-300">${paymentMethod.toUpperCase()}</span>
                    </div>
                </div>
                
                <p class="text-sm text-gray-400">Booking details have been sent to your email</p>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'View Booking',
        cancelButtonText: 'Close'
    }).then((result) => {
        if (result.isConfirmed) {
            showBookingHistory();
        }
    });
}

// ============================
// UPI PAYMENT FUNCTIONS
// ============================

function showUPIPaymentOptions() {
    const upiId = "6304248659@ybl";
    const amount = bookingDetails ? bookingDetails.total.toFixed(2) : "0.00";
    
    Swal.fire({
        title: 'UPI Payment',
        html: `
            <div class="text-center">
                <div class="qr-container mx-auto mb-4">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=TravelFlux%20Pro&am=${amount}&tn=Travel%20Booking`)}" 
                         alt="QR Code" class="w-48 h-48">
                </div>
                <p class="text-gray-400 mb-4">Scan this QR code with any UPI app</p>
                <div class="space-y-2 mb-4">
                    <div class="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span class="text-gray-400">UPI ID:</span>
                        <span class="text-white font-mono">${upiId}</span>
                    </div>
                    <div class="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span class="text-gray-400">Amount:</span>
                        <span class="text-violet-400 font-bold">₹ ${amount}</span>
                    </div>
                    <div class="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span class="text-gray-400">Merchant:</span>
                        <span class="text-violet-300">TravelFlux Pro</span>
                    </div>
                </div>
                <p class="text-sm text-gray-400">Or click on UPI app buttons below</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'I have paid',
        cancelButtonText: 'Cancel',
        width: 500
    }).then((result) => {
        if (result.isConfirmed) {
            completeBooking('upi');
        }
    });
}

function openUPIApp(app) {
    const upiId = "6304248659@ybl";
    const amount = bookingDetails ? bookingDetails.total.toFixed(2) : "0.00";
    const appNames = {
        phonepe: 'PhonePe',
        gpay: 'Google Pay', 
        paytm: 'Paytm'
    };
    
    // Create UPI deep links
    const upiLinks = {
        phonepe: `phonepe://upi/pay?pa=${upiId}&pn=TravelFlux%20Pro&am=${amount}&tn=Travel%20Booking`,
        gpay: `tez://upi/pay?pa=${upiId}&pn=TravelFlux%20Pro&am=${amount}&tn=Travel%20Booking`,
        paytm: `paytmmp://upi/pay?pa=${upiId}&pn=TravelFlux%20Pro&am=${amount}&tn=Travel%20Booking`
    };
    
    Swal.fire({
        title: `Opening ${appNames[app]}`,
        html: `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full ${app === 'phonepe' ? 'bg-violet-600/20' : app === 'gpay' ? 'bg-violet-600/20' : 'bg-violet-500/20'} flex items-center justify-center mx-auto mb-4">
                    <i class="fab fa-${app === 'phonepe' ? 'mobile-alt' : app === 'gpay' ? 'google' : 'paytm'} text-${app === 'phonepe' ? 'violet' : app === 'gpay' ? 'violet' : 'violet'}-400 text-2xl"></i>
                </div>
                <p class="text-gray-300 mb-4">Redirecting to ${appNames[app]} for payment...</p>
                <div class="loader mx-auto"></div>
                
                <div class="mt-6 p-4 bg-gray-900/50 rounded-lg">
                    <p class="text-sm text-gray-400">If not redirected automatically:</p>
                    <p class="text-sm text-white mt-1">1. Open ${appNames[app]} manually</p>
                    <p class="text-sm text-white">2. Enter UPI ID: <span class="font-mono text-violet-300">${upiId}</span></p>
                    <p class="text-sm text-white">3. Amount: <span class="text-violet-400">₹ ${amount}</span></p>
                </div>
            </div>
        `,
        showCancelButton: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 3000,
        timerProgressBar: true
    }).then(() => {
        // Try to open the UPI app
        window.location.href = upiLinks[app];
        
        // Fallback: Show manual instructions
        setTimeout(() => {
            Swal.fire({
                title: 'Manual Payment Required',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Please complete payment in ${appNames[app]} manually:</p>
                        <div class="space-y-2">
                            <p><strong>UPI ID:</strong> <span class="font-mono">${upiId}</span></p>
                            <p><strong>Amount:</strong> ₹ ${amount}</p>
                            <p><strong>Merchant:</strong> TravelFlux Pro</p>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'I have paid',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    completeBooking(app);
                }
            });
        }, 1000);
    });
}

// ============================
// CHATBOT FUNCTIONS
// ============================

function toggleChatbot() {
    const chatbotWindow = document.querySelector('.chatbot-window');
    if (!chatbotWindow) return;
    
    if (chatbotWindow.style.display === 'flex') {
        chatbotWindow.style.display = 'none';
    } else {
        chatbotWindow.style.display = 'flex';
    }
}

function sendChatbotMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input?.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const responses = [
            "I can help you plan routes between cities in Andhra Pradesh. Try entering cities in the route planner!",
            "For booking assistance, please make sure you're logged in and have calculated a route first.",
            "Popular tourist spots in Andhra Pradesh include Araku Valley, Borra Caves, and Gandikota Canyon.",
            "The best time to visit Andhra Pradesh is from October to March when the weather is pleasant.",
            "Available transport options include bus, train, car, auto, and flights for longer distances."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addChatMessage(randomResponse, 'bot');
    }, 1000);
}

function handleChatbotKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatbotMessage();
    }
}

function quickChatbotQuestion(question) {
    const chatbotInput = document.getElementById('chatbotInput');
    if (chatbotInput) {
        chatbotInput.value = question;
        sendChatbotMessage();
    }
}

function addChatMessage(message, sender) {
    const messagesDiv = document.getElementById('chatbotMessages');
    if (!messagesDiv) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="flex items-center space-x-2 mb-1">
                <i class="fas fa-robot text-violet-400"></i>
                <span class="font-semibold">Travel Assistant</span>
            </div>
            ${message}
        `;
    } else {
        messageDiv.textContent = message;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================
// UTILITY FUNCTIONS
// ============================

function saveRoute() {
    if (!currentRoute) {
        Swal.fire('Error', 'No route to save', 'error');
        return;
    }
    
    if (isGuest) {
        Swal.fire({
            title: 'Login Required',
            text: 'Please login to save routes',
            icon: 'warning',
            confirmButtonText: 'Login'
        }).then(() => {
            showLoginModal();
        });
        return;
    }
    
    Swal.fire({
        title: 'Route Saved!',
        text: 'Your route has been saved to your account',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

function shareRoute() {
    if (!currentRoute) {
        Swal.fire('Error', 'No route to share', 'error');
        return;
    }
    
    const routeText = `Check out this route from ${currentRoute.from} to ${currentRoute.to} on TravelFlux Pro!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'TravelFlux Pro Route',
            text: routeText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(routeText + '\n' + window.location.href);
        Swal.fire({
            title: 'Link Copied!',
            text: 'Route link copied to clipboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

function hideStorageInfo() {
    const dataStorageInfo = document.getElementById('dataStorageInfo');
    if (dataStorageInfo) {
        dataStorageInfo.classList.add('hidden');
    }
}

function showUserDashboard() {
    Swal.fire({
        title: 'User Dashboard',
        html: `
            <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-4">Welcome, ${currentUser?.name || 'Guest'}!</h3>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="glass p-4 rounded-lg">
                        <i class="fas fa-route text-violet-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-400">Routes Planned</p>
                        <p class="text-2xl font-bold text-white">0</p>
                    </div>
                    <div class="glass p-4 rounded-lg">
                        <i class="fas fa-ticket-alt text-violet-400 text-2xl mb-2"></i>
                        <p class="text-sm text-gray-400">Bookings</p>
                        <p class="text-2xl font-bold text-white">0</p>
                    </div>
                </div>
                
                <div class="text-left space-y-2">
                    <p><i class="fas fa-user text-violet-400 mr-2"></i> Account Type: ${isGuest ? 'Guest' : 'Registered User'}</p>
                    <p><i class="fas fa-envelope text-violet-400 mr-2"></i> Email: ${currentUser?.email || 'Not logged in'}</p>
                    ${currentUser?.age ? `<p><i class="fas fa-id-card text-violet-400 mr-2"></i> Age: ${currentUser.age} years</p>` : ''}
                </div>
            </div>
        `,
        showCancelButton: !isGuest,
        confirmButtonText: 'OK',
        cancelButtonText: 'View Bookings'
    }).then((result) => {
        if (result.isCanceled) {
            showBookingHistory();
        }
    });
}

function showBookingHistory() {
    Swal.fire({
        title: 'Booking History',
        html: `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-history text-violet-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">Your Bookings</h3>
                <p class="text-gray-400 mb-4">All your travel bookings will appear here</p>
                
                <div class="glass p-4 rounded-lg mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400">No bookings yet</span>
                        <span class="text-violet-400">Pending</span>
                    </div>
                    <p class="text-sm text-gray-300">Plan and book your first trip!</p>
                </div>
                
                <button onclick="scrollToPlanner()" class="btn-primary w-full mt-4">
                    <i class="fas fa-route mr-2"></i>Plan Your First Trip
                </button>
            </div>
        `,
        confirmButtonText: 'Close'
    });
}

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
    
    // Load cities after a short delay
    setTimeout(() => {
        loadPopularCities();
        loadCitiesGrid();
    }, 100);
    
    // Set today's date for travel date
    const today = new Date().toISOString().split('T')[0];
    const travelDateInput = document.getElementById('travelDate');
    if (travelDateInput) {
        travelDateInput.min = today;
        travelDateInput.value = today;
    }
    
    // Set max date for DOB to 18 years ago
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 18);
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
    
    // Load user data
    loadUserData();
    updateAgeVerificationUI();
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('light-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                icon.style.color = '#f59e0b';
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                icon.style.color = '#c4b5fd';
            }
        });
    }
    
    // User dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', function() {
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
    
    // Background slideshow
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slideshow-slide');
    
    if (slides.length > 0) {
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }
    
    console.log('TravelFlux Pro initialized successfully!');
    console.log(`Total cities in database: ${andhraPradeshCities ? andhraPradeshCities.length : 0}`);
});

function initDatabase() {
    if (!window.indexedDB) {
        console.warn("IndexedDB not supported. Some features may be limited.");
        return;
    }

    const request = indexedDB.open("TravelFluxDB", 1);
    
    request.onerror = function(event) {
        console.error("Database error: ", event.target.errorCode);
    };

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('bookings')) {
            const bookingStore = db.createObjectStore('bookings', { keyPath: 'id', autoIncrement: true });
            bookingStore.createIndex('userId', 'userId', { unique: false });
            bookingStore.createIndex('bookingDate', 'bookingDate', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('savedRoutes')) {
            const routesStore = db.createObjectStore('savedRoutes', { keyPath: 'id', autoIncrement: true });
            routesStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('preferences')) {
            const prefStore = db.createObjectStore('preferences', { keyPath: 'userId' });
        }
    };

    request.onsuccess = function(event) {
        console.log("Database initialized successfully");
    };
}

function loadUserData() {
    const userData = localStorage.getItem('travelflux_user');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            isGuest = false;
            updateUserUI();
        } catch (e) {
            console.error('Error parsing user data:', e);
            createGuestUser();
        }
    } else {
        createGuestUser();
    }
}

function createGuestUser() {
    currentUser = {
        id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@travelflux.com',
        isGuest: true
    };
    isGuest = true;
    updateUserUI();
}