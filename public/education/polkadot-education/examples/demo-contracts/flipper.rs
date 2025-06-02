// examples/demo-contracts/flipper.rs
//
// A simple boolean flip contract example for Polkadot using ink!
// This contract demonstrates basic state management with a boolean value.

#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod flipper {
    /// The Flipper contract holds a single boolean value that can be flipped.
    #[ink(storage)]
    pub struct Flipper {
        /// The single boolean value stored in the contract.
        value: bool,
    }

    impl Flipper {
        /// Constructor that initializes the boolean value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(init_value: bool) -> Self {
            Self { value: init_value }
        }

        /// Constructor that initializes the boolean value to `false`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(false)
        }

        /// A message that can be called on instantiated contracts.
        /// This one flips the value of the stored `bool` from `true`
        /// to `false` and vice versa.
        #[ink(message)]
        pub fn flip(&mut self) {
            self.value = !self.value;
        }

        /// Simply returns the current value of our `bool`.
        #[ink(message)]
        pub fn get(&self) -> bool {
            self.value
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// We test if the default constructor does its job.
        #[test]
        fn default_works() {
            let flipper = Flipper::default();
            assert_eq!(flipper.get(), false);
        }

        /// We test a simple use case of our contract.
        #[test]
        fn it_works() {
            let mut flipper = Flipper::new(false);
            assert_eq!(flipper.get(), false);
            flipper.flip();
            assert_eq!(flipper.get(), true);
        }
    }
}

// Deployment Instructions:
// 
// 1. Install the ink! CLI:
//    cargo install cargo-contract --force
//
// 2. Compile the contract:
//    cargo +nightly contract build
//
// 3. Deploy using the Polkadot JS Apps UI:
//    - Go to https://polkadot.js.org/apps/
//    - Connect to your desired network
//    - Navigate to "Developer" -> "Contracts"
//    - Click "Upload & Deploy Code"
//    - Upload the generated .contract file
//    - Set the initial value (true or false)
//    - Deploy the contract
//
// 4. Interact with the contract:
//    - Use the "flip" method to change the value
//    - Use the "get" method to read the current value