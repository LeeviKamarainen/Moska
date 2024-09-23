import random
from typing import List
import matplotlib.pyplot as plt
from scipy import stats
from scipy.stats import rv_continuous
import numpy as np
import math

class AdjustRatingEstimate:
    def __init__(self):
        pass
        
    def __call__(self, winner_idxs, loser_idxs, current_estimate):
        return self.adjust(winner_idxs, loser_idxs, current_estimate)
    
    def adjust(self):
        raise NotImplementedError("adjust not implemented for AdjustRatingEstimate")
    
class AdjustRatingEstimateBaseline(AdjustRatingEstimate):
    def __init__(self, total_change=1):
        self.total_change = total_change
        super().__init__()
        
    def adjust(self, winner_idxs, loser_idxs, current_estimate):
        new_estimates = current_estimate.copy()
        for widx in winner_idxs:
            new_estimates[widx] += (1/2) * self.total_change / len(winner_idxs)
        for lidx in loser_idxs:
            new_estimates[lidx] -= (1/2) * self.total_change / len(loser_idxs)
        return new_estimates
    
class AdjustRatingEstimateSoftmax(AdjustRatingEstimate):
    def __init__(self, learning_rate=0.05):
        self.learning_rate = learning_rate
        super().__init__()
        
    def adjust(self, winner_idxs, loser_idxs, current_estimate):
        indices_to_update = winner_idxs + loser_idxs
        #print(indices_to_update)
        #print(current_estimate)
        current_estimate = np.array(current_estimate)
        
        player_estimates = current_estimate[indices_to_update]
        # Calculate softmax probabilities for current rating estimates
        loser_proba_estimates = np.exp(player_estimates) / np.sum(np.exp(player_estimates))

        # True loser probabilities: 1 for the actual losers, 0 for everyone else
        loser_proba_true = np.array([0 if i not in loser_idxs else 1 for i in indices_to_update])

        # Compute the cross-entropy loss
        self.loss = -np.sum([p_true * np.log(p_est + 1e-9) for p_true, p_est in zip(loser_proba_true, loser_proba_estimates)])

        # Compute the gradient of the cross-entropy loss
        gradient = np.zeros(len(indices_to_update))
        for idx,_ in enumerate(indices_to_update):
            gradient[idx] = loser_proba_true[idx] - loser_proba_estimates[idx]

        # Update the player estimates using the gradient and learning rate
        new_estimates = player_estimates + self.learning_rate * gradient
            
        # Update the full estimate with the players updated estimates
        current_estimate[indices_to_update] = new_estimates
        return current_estimate.tolist()
    
class AdjustRatingEstimateSoftmaxMomentum(AdjustRatingEstimate):
    def __init__(self, learning_rate=0.05, momentum=0.9):
        self.learning_rate = learning_rate
        self.momentum = momentum
        self.velocity = None
        
    def adjust(self, winner_idxs, loser_idxs, current_estimate):
        indices_to_update = winner_idxs + loser_idxs
        current_estimate = np.array(current_estimate)
        
        player_estimates = current_estimate[indices_to_update]
        # Calculate softmax probabilities for current rating estimates
        loser_proba_estimates = np.exp(player_estimates) / np.sum(np.exp(player_estimates))

        # True loser probabilities: 1 for the actual losers, 0 for everyone else
        loser_proba_true = np.array([0 if i not in loser_idxs else 1 for i in indices_to_update])

        # Compute the cross-entropy loss
        self.loss = -np.sum([p_true * np.log(p_est + 1e-9) for p_true, p_est in zip(loser_proba_true, loser_proba_estimates)])

        # Compute the gradient of the cross-entropy loss
        gradient = np.zeros(len(indices_to_update))
        for idx,_ in enumerate(indices_to_update):
            gradient[idx] = loser_proba_true[idx] - loser_proba_estimates[idx]

        # Update the player estimates using the gradient and learning rate
        if self.velocity is None:
            self.velocity = np.zeros(len(indices_to_update))
        self.velocity = self.momentum * self.velocity - self.learning_rate * gradient
        new_estimates = player_estimates + self.velocity
            
        # Update the full estimate with the players updated estimates
        current_estimate[indices_to_update] = new_estimates
        return current_estimate.tolist()
    
    
class AdjustRatingEstimateTotalPoints(AdjustRatingEstimate):
    def __init__(self, total_points=0.1):
        self.total_points = total_points
        super().__init__()
        
    def adjust(self, winner_idxs, loser_idxs, current_estimate):
        new_estimates = current_estimate.copy()

        # Calculate the sum of all players' ratings
        total_rating_sum = sum(current_estimate)

        # Get the loser's rating
        loser_idx = loser_idxs[0]
        loser_rating = current_estimate[loser_idx]

        # Penalty for the loser is proportional to their rating relative to the total rating pool
        loser_penalty = self.total_points * (loser_rating / total_rating_sum)

        # Apply the penalty to the loser
        new_estimates[loser_idx] -= loser_penalty

        # Distribute the points equally among the winners
        points_per_winner = loser_penalty / len(winner_idxs)

        for widx in winner_idxs:
            new_estimates[widx] += points_per_winner

        return new_estimates

class Luck:
    def __init__(self, arg1, arg2):
        self.arg1 = arg1
        self.arg2 = arg2
        self.distribution : rv_continuous = self.create_distribution()
    
    def create_distribution(self):
        raise NotImplementedError(f"create_distribution not implemented for {self.__class__.__name__}")
    
    def sample(self):
        return self.distribution.rvs()
    
    def __repr__(self):
        return f"{self.__class__.__name__}({self.arg1}, {self.arg2})"
    
class NormalLuck(Luck):
    def create_distribution(self):
        return stats.norm(loc=self.arg1, scale=self.arg2)

class Player:
    def __init__(self, name, rating):
        self.name = name
        self.rating = rating
        self.data = []

    def __repr__(self):
        return f"Player({self.name}, {self.rating})"
    
    def add_data(self, data):
        self.data.append(data)


class Game:
    def __init__(self, players : List[Player], luck_distribution : Luck):
        self.players = players
        self.luck_distribution = luck_distribution
    
    def select_loser(self):
        # The loser is the player with the lowest score (=rating + luck)
        scores = [player.rating + self.luck_distribution.sample() for player in self.players]
        loser = self.players[scores.index(min(scores))]
        return loser
    
    def simulate(self):
        # We have one loser, and the rest are winners
        loser = self.select_loser()
        winners = [player for player in self.players if player != loser]
        return winners, [loser]
    
class MoskaGame(Game):
    def __init__(self, players : List[Player]):
        super().__init__(players, NormalLuck(0,0.8))
        
    
def estimate_ratings(players, num_games, base_estimates, game_class):
    current_estimate = base_estimates.copy()
    estimate_history = [current_estimate]
    scorr_history = []
    adjuster = AdjustRatingEstimateSoftmaxMomentum(learning_rate=0.01, momentum=0.0)
    #adjuster = AdjustRatingEstimateTotalPoints(total_points=0.2)
    
    for _ in range(num_games):
        selected_players = random.sample(players, 4)
        game = game_class(selected_players)
        winners, losers = game.simulate()
        winner_idxs = [players.index(winner) for winner in winners]
        loser_idxs = [players.index(loser) for loser in losers]
        current_estimate = adjuster(winner_idxs, loser_idxs, current_estimate)
        estimated_ranking = {player : current_estimate[i] for i, player in enumerate(players)}
        loss = compare_rankings(players, estimated_ranking)
        scorr_history.append(loss)
        estimate_history.append(current_estimate)
        
    return estimate_history, scorr_history
        
def test_percent_losses_for_players(players, num_games, game_class):
    """ Test how many percent of the games each player loses
    """
    losses = {player : 0 for player in players}
    for _ in range(num_games):
        game = game_class(players)
        winners, losers = game.simulate()
        for loser in losers:
            losses[loser] += 1
    return {player : losses[player] / num_games for player in players}

def compare_rankings(players, estimated_ratings):
    """ Compare the true and estimated rankings of the players
    """
    # Compare how similar ranking we get to the true ranking
    true_ranking = sorted(players, key=lambda p: p.rating)
    true_ranking = [player.name for player in true_ranking]
    estimated_ranking = sorted(players, key=lambda p: estimated_ratings[p])
    estimated_ranking = [player.name for player in estimated_ranking]
    # For comparison, we use the Spearman rank correlation coefficient
    spearman_corr, _ = stats.spearmanr(range(len(players)), [true_ranking.index(name) for name in estimated_ranking])
    return spearman_corr

def test_adjust_ratings_baseline():
    num_games = 500
    player_true_ratings = [i for i in np.linspace(0.4,0.8,10)]
    players = [Player(f"Player {i}", rating) for i, rating in enumerate(player_true_ratings)]
    player_true_ratings = {player : player.rating for player in players}
    pl_loss_percents = test_percent_losses_for_players(players, 1000, MoskaGame)
    print(pl_loss_percents)
    base_estimates = [0.5 for _ in players]
    
    estimate_history,loss_history = estimate_ratings(players, num_games,base_estimates, MoskaGame)
    last_estimate = estimate_history[-1]
    player_final_ratings = {player : last_estimate[i] for i, player in enumerate(players)}
    print(last_estimate)
    print(player_final_ratings)
    # Normalize the ratings to be between 0 and 1
    max_rating = max(player_final_ratings.values())
    min_rating = min(player_final_ratings.values())
    #for player in player_final_ratings:
    #    player_final_ratings[player] = (player_final_ratings[player] - min_rating) / (max_rating - min_rating)
    
    spearman_corr = compare_rankings(players,player_final_ratings)
    print(f"Spearman rank correlation: {spearman_corr}")
    
    # Reverse players
    players = players[::-1]
    estimate_history = np.array(estimate_history)
    fig, ax = plt.subplots()
    # Progression of the players' ratings
    for i, player in enumerate(players):
        # Plot the estimated rating history
        l = ax.plot([estimate[-i-1] for estimate in estimate_history], label=f"{player.name}(r={round(player.rating,2)})")
        # Plot the true rating
        #ax.plot([player.rating for _ in range(num_games+1)], linestyle="--", color=l[0].get_color())
    ax.grid()
    ax.legend()
    ax.set_xlabel("Game")
    ax.set_ylabel("Rating")
    ax.set_title("Estimated internal rating (relative)")
    # Plot the loss history
    fig, ax = plt.subplots()
    ax.plot(loss_history)
    # Plot a windowed average
    window_size = 10
    windowed_avg = [sum(loss_history[i:i+window_size]) / window_size for i in range(len(loss_history) - window_size)]
    ax.plot(range(window_size, len(loss_history)), windowed_avg, color="red", label=f"Windowed average (size={window_size})")
    ax.set_xlabel("Game")
    ax.set_ylabel("Spearmans rank correlation")
    ax.set_title("Spearmans rank correlation over time")
    ax.grid()
    
    plt.show()
    
test_adjust_ratings_baseline()
        