// examples/demo-contracts/erc20.rs
//
// An ERC-20 token contract example for Polkadot using ink!
// This contract demonstrates a standard token implementation with transfer functionality.

#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod erc20 {
    use ink_storage::{
        collections::HashMap,
        lazy::Lazy,
    };

    /// The ERC-20 error types.
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Returned if the balance is insufficient for the operation.
        InsufficientBalance,
        /// Returned if the allowance is insufficient for the operation.
        InsufficientAllowance,
    }

    /// The ERC-20 result type.
    pub type Result<T> = core::result::Result<T, Error>;

    /// Event emitted when a token transfer occurs.
    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        from: Option<AccountId>,
        #[ink(topic)]
        to: Option<AccountId>,
        value: Balance,
    }

    /// Event emitted when an approval occurs.
    #[ink(event)]
    pub struct Approval {
        #[ink(topic)]
        owner: AccountId,
        #[ink(topic)]
        spender: AccountId,
        value: Balance,
    }

    /// The ERC-20 storage items.
    #[ink(storage)]
    pub struct Erc20 {
        /// Total token supply.
        total_supply: Lazy<Balance>,
        /// Mapping from owner to balance.
        balances: HashMap<AccountId, Balance>,
        /// Mapping from owner to spender to allowance.
        allowances: HashMap<(AccountId, AccountId), Balance>,
        /// Token name.
        name: Lazy<String>,
        /// Token symbol.
        symbol: Lazy<String>,
        /// Token decimals.
        decimals: Lazy<u8>,
    }

    impl Erc20 {
        /// Creates a new ERC-20 contract with the specified initial supply.
        #[ink(constructor)]
        pub fn new(
            initial_supply: Balance,
            name: String,
            symbol: String,
            decimals: u8,
        ) -> Self {
            let caller = Self::env().caller();
            let mut balances = HashMap::new();
            balances.insert(caller, initial_supply);

            Self::env().emit_event(Transfer {
                from: None,
                to: Some(caller),
                value: initial_supply,
            });

            Self {
                total_supply: Lazy::new(initial_supply),
                balances,
                allowances: HashMap::new(),
                name: Lazy::new(name),
                symbol: Lazy::new(symbol),
                decimals: Lazy::new(decimals),
            }
        }

        /// Returns the token name.
        #[ink(message)]
        pub fn name(&self) -> String {
            (*self.name).clone()
        }

        /// Returns the token symbol.
        #[ink(message)]
        pub fn symbol(&self) -> String {
            (*self.symbol).clone()
        }

        /// Returns the token decimals.
        #[ink(message)]
        pub fn decimals(&self) -> u8 {
            *self.decimals
        }

        /// Returns the total token supply.
        #[ink(message)]
        pub fn total_supply(&self) -> Balance {
            *self.total_supply
        }

        /// Returns the account balance for the specified `owner`.
        #[ink(message)]
        pub fn balance_of(&self, owner: AccountId) -> Balance {
            self.balances.get(&owner).copied().unwrap_or(0)
        }

        /// Returns the amount which `spender` is allowed to withdraw from `owner`.
        #[ink(message)]
        pub fn allowance(&self, owner: AccountId, spender: AccountId) -> Balance {
            self.allowances.get(&(owner, spender)).copied().unwrap_or(0)
        }

        /// Transfers `value` amount of tokens from the caller's account to account `to`.
        #[ink(message)]
        pub fn transfer(&mut self, to: AccountId, value: Balance) -> Result<()> {
            let from = self.env().caller();
            self.transfer_from_to(from, to, value)
        }

        /// Allows `spender` to withdraw from the caller's account multiple times, up to
        /// the `value` amount.
        #[ink(message)]
        pub fn approve(&mut self, spender: AccountId, value: Balance) -> Result<()> {
            let owner = self.env().caller();
            self.allowances.insert((owner, spender), value);
            self.env().emit_event(Approval {
                owner,
                spender,
                value,
            });
            Ok(())
        }

        /// Transfers `value` tokens on behalf of `from` to the account `to`.
        #[ink(message)]
        pub fn transfer_from(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
        ) -> Result<()> {
            let caller = self.env().caller();
            let allowance = self.allowance(from, caller);
            if allowance < value {
                return Err(Error::InsufficientAllowance);
            }
            self.transfer_from_to(from, to, value)?;
            self.allowances.insert((from, caller), allowance - value);
            Ok(())
        }

        /// Transfers `value` amount of tokens from the `from` account to the `to` account.
        fn transfer_from_to(
            &mut self,
            from: AccountId,
            to: AccountId,
            value: Balance,
        ) -> Result<()> {
            let from_balance = self.balance_of(from);
            if from_balance < value {
                return Err(Error::InsufficientBalance);
            }

            self.balances.insert(from, from_balance - value);
            let to_balance = self.balance_of(to);
            self.balances.insert(to, to_balance + value);

            self.env().emit_event(Transfer {
                from: Some(from),
                to: Some(to),
                value,
            });

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink_lang as ink;

        #[ink::test]
        fn new_works() {
            let contract = Erc20::new(
                100,
                String::from("Token Name"),
                String::from("TN"),
                18,
            );
            assert_eq!(contract.total_supply(), 100);
            assert_eq!(contract.name(), String::from("Token Name"));
            assert_eq!(contract.symbol(), String::from("TN"));
            assert_eq!(contract.decimals(), 18);
        }

        #[ink::test]
        fn transfer_works() {
            let mut contract = Erc20::new(
                100,
                String::from("Token Name"),
                String::from("TN"),
                18,
            );
            let accounts = ink_env::test::default_accounts::<ink_env::DefaultEnvironment>();
            
            // Transfer to accounts.bob
            assert_eq!(contract.balance_of(accounts.bob), 0);
            assert_eq!(contract.transfer(accounts.bob, 10), Ok(()));
            assert_eq!(contract.balance_of(accounts.bob), 10);
        }

        #[ink::test]
        fn transfer_from_works() {
            let mut contract = Erc20::new(
                100,
                String::from("Token Name"),
                String::from("TN"),
                18,
            );
            let accounts = ink_env::test::default_accounts::<ink_env::DefaultEnvironment>();
            
            // Approve accounts.bob to spend 20 tokens
            assert_eq!(contract.approve(accounts.bob, 20), Ok(()));
            
            // Transfer from alice to charlie using bob's allowance
            ink_env::test::set_caller::<ink_env::DefaultEnvironment>(accounts.bob);
            assert_eq!(contract.transfer_from(accounts.alice, accounts.charlie, 10), Ok(()));
            assert_eq!(contract.balance_of(accounts.charlie), 10);
        }

        #[ink::test]
        fn insufficient_balance_fails() {
            let mut contract = Erc20::new(
                100,
                String::from("Token Name"),
                String::from("TN"),
                18,
            );
            let accounts = ink_env::test::default_accounts::<ink_env::DefaultEnvironment>();
            
            // Try to transfer more than the total supply
            assert_eq!(contract.transfer(accounts.bob, 101), Err(Error::InsufficientBalance));
            assert_eq!(contract.balance_of(accounts.bob), 0);
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
//    - Set the initial supply, name, symbol, and decimals
//    - Deploy the contract
//
// 4. Interact with the contract:
//    - Use the "transfer" method to send tokens
//    - Use the "approve" method to allow others to spend your tokens
//    - Use the "transferFrom" method to spend approved tokens
//    - Use the "balanceOf" method to check account balances