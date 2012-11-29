(ns hedgehog.todos
  (:use-macros [hedgehog.macros :only [defstate defevents defpartial]])
  (:require [hedgehog.core :as hedgehog]))

;; application state
(defstate
  {:todos ["buy milk" "eat lunch" "drink milk"]
   :pending {:todo "foo bar"}})

;; COs based on data state
(defco :first-todo (nth (get :todos) 0))

;; application logic
(defn add-pending-todo! []
  (add! :todos (get :todo :pending))
  (clear! :todo :pending))

;; html templates
(defn todo-element [todo]
  [:li.todo todo])

Modif. [our todos] => li and input box

(defpartial todos
  [:title (bind! :pending-todo)]
  [:div#todos
     [:h1 (str "Todos (" (bind! :num-todos) ")")]
     [:ul (map todo-element :todos)
      [:input#input
       {:value (bind! :todo :pending) :type "text"}]
      [:button "Add"
       {:click add-pending-todo!}]
      [:span (bind! :todo :pending)]]])

(init! todos)